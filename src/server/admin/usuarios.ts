"use server";

/**
 * Admin USER server actions — list, change role, activate/deactivate.
 *
 * Golden rules of this module (non-negotiable):
 * - Authorization ALWAYS on the server, with the EXACT permission of each action:
 *     list               -> "usuario:listar"       (ADMIN ONLY)
 *     change role/status -> "usuario:gestionarRol" (ADMIN ONLY)
 *   `assertCan` throws `AuthError`. In reads it is LEFT to propagate (the page
 *   catches it and shows a 403). In mutations it is caught at the boundary ->
 *   { ok:false, error }. NOTE: the /admin layout admits VENDEDOR|ADMIN; these
 *   actions are strict, with their own SOLO_ADMIN permission.
 *
 * - EXPLICIT INCLUSION SELECT always: this module NEVER selects the password
 *   hash. Only the fields the DTO needs are requested; nothing sensitive crosses
 *   into a DTO, log or error message.
 *
 * - ANTI-LOCKOUT (checked INSIDE a transaction to avoid races):
 *     (a) an admin can NOT change their OWN role;
 *     (b) an admin can NOT deactivate THEMSELVES;
 *     (c) the LAST active ADMIN can NOT be demoted or deactivated
 *         (count of active admins + update CONDITIONED on the value read).
 *
 * - IDEMPOTENCY: putting a user in the state it already has returns
 *   { ok:true, cambiado:false } WITHOUT logging an audit entry or revalidating.
 *
 * - AUDIT: every REAL change is logged with a structured `console.info`.
 *   TODO(auditoria): migrate to a DB-backed `AuditLog` (model + write inside the
 *   same tx) — the project's security rules ask for an audit log of role/status
 *   changes "if possible"; it stays as a follow-up so as not to invent schema
 *   outside the scope of this feature.
 *
 * - `Date` does not cross to the client: the DTO returns dates in ISO (string).
 *
 * TODO(sesiones): deactivating a user does NOT invalidate their current JWT: the
 * session stays valid until it expires. The credentials provider already rejects
 * inactive accounts on the NEXT login; an immediate invalidation would require a
 * revocation list (denylist of tokens/jti), which is outside the scope of this
 * feature.
 */
import { revalidatePath } from "next/cache";
import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan, AuthError, type UsuarioSesion } from "@/lib/auth/guard";
import {
  rolUsuarioSchema,
  type FiltrosUsuariosAdmin,
} from "@/lib/validators/usuarios";

// ── Constants ────────────────────────────────────────────────────────────────

/** Users per page in the admin table. */
const TAMANO_PAGINA_USUARIOS = 12;

/** Route to revalidate after a mutation with a real change. */
const RUTA_USUARIOS = "/admin/usuarios";

// ── Output types (serializable) ───────────────────────────────────────────────

/** Row of the admin users DataTable (serializable). */
export type UsuarioFilaAdmin = {
  id: string;
  nombre: string;
  email: string;
  role: Role;
  activo: boolean;
  /** Sign-up date in ISO 8601 (the client formats it as DD/MM/YYYY). */
  creadoEn: string;
  totalPedidos: number;
  /** true if it is the user of the current session (the UI disables actions on oneself). */
  esActual: boolean;
};

/** Result of the paginated user list. */
export type ResultadoListaUsuarios = {
  usuarios: UsuarioFilaAdmin[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

/** Uniform result of the user mutations. */
export type ResultadoMutacionUsuario =
  | { ok: true; cambiado: boolean }
  | { ok: false; error: string };

// ── Messages (Spanish, without leaking technical detail) ─────────────────────

const ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";
const ERROR_NO_ENCONTRADO = "No encontramos ese usuario.";
const ERROR_ROL_INVALIDO = "El rol indicado no es válido.";
const ERROR_PROPIO_ROL = "No puedes cambiar tu propio rol.";
const ERROR_PROPIA_CUENTA = "No puedes desactivar tu propia cuenta.";
const ERROR_ULTIMO_ADMIN =
  "No puedes quitar el rol al último administrador activo.";
const ERROR_ULTIMO_ADMIN_ACTIVO =
  "No puedes desactivar al último administrador activo.";
const ERROR_CONCURRENCIA =
  "El usuario cambió mientras procesábamos la operación. Vuelve a intentarlo.";

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Turns an `AuthError` into a result; rethrows any other error. */
function falloAuth(error: unknown): ResultadoMutacionUsuario | null {
  if (error instanceof AuthError) {
    return { ok: false, error: error.mensajePublico };
  }
  return null;
}

/** Builds the WHERE of the users DataTable from the filters. */
function construirWhereUsuarios(
  f: FiltrosUsuariosAdmin,
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {};

  if (f.q) {
    where.OR = [
      { nombre: { contains: f.q, mode: "insensitive" } },
      { email: { contains: f.q, mode: "insensitive" } },
    ];
  }

  if (f.rol !== "todos") {
    where.role = f.rol;
  }

  switch (f.estado) {
    case "activos":
      where.activo = true;
      break;
    case "inactivos":
      where.activo = false;
      break;
    case "todos":
    default:
      break;
  }

  return where;
}

// ── READ: paginated list ─────────────────────────────────────────────────────

/**
 * Paginated list of users for the admin (12/page). Requires "usuario:listar"
 * (ADMIN ONLY). Case-insensitive `q` search on name/email, role and status filters.
 * Order: most recent first. `totalPaginas` is at least 1.
 *
 * EXPLICIT inclusion SELECT: the password hash is never requested. `esActual`
 * marks the session user so that the UI disables actions on themselves.
 *
 * Throws `AuthError` if the role falls short (the page catches it -> 403). It is
 * not wrapped in { ok } because it is a Server Component READ.
 */
export async function listarUsuariosAdmin(
  filtros: FiltrosUsuariosAdmin,
): Promise<ResultadoListaUsuarios> {
  const actor = await assertCan("usuario:listar");

  const where = construirWhereUsuarios(filtros);
  const take = TAMANO_PAGINA_USUARIOS;
  const skip = (filtros.page - 1) * take;

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        email: true,
        role: true,
        activo: true,
        createdAt: true,
        _count: { select: { pedidos: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / take));

  return {
    usuarios: rows.map((u) => ({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      role: u.role,
      activo: u.activo,
      creadoEn: u.createdAt.toISOString(),
      totalPedidos: u._count.pedidos,
      esActual: u.id === actor.id,
    })),
    total,
    pagina: filtros.page,
    totalPaginas,
  };
}

// ── MUTATION: change role ─────────────────────────────────────────────────────

/**
 * Changes a user's role. Requires "usuario:gestionarRol" (ADMIN ONLY).
 *
 * Rules:
 *  - `id === actor` => error "No puedes cambiar tu propio rol." (anti-lockout a).
 *  - `rolNuevo` is validated with `rolUsuarioSchema`; if it is not valid => error.
 *  - Inside a transaction: reads the target user (select WITHOUT the hash); if it
 *    does not exist => generic error; if it already has that role =>
 *    { ok:true, cambiado:false } with NO log; if the target is an active ADMIN and
 *    ADMIN is being taken away, the ACTIVE admins are counted and if <= 1 =>
 *    "último administrador activo" error (anti-lockout c).
 *  - The update is CONDITIONED on the role read (`updateMany where { id, role }`); if
 *    it affects 0 rows => concurrency error.
 *
 * Returns { ok:true, cambiado } | { ok:false, error }.
 */
export async function cambiarRolUsuario(
  id: string,
  rolNuevo: unknown,
): Promise<ResultadoMutacionUsuario> {
  let actor: UsuarioSesion;
  try {
    actor = await assertCan("usuario:gestionarRol");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  // Anti-lockout (a): nobody changes their own role.
  if (id === actor.id) {
    return { ok: false, error: ERROR_PROPIO_ROL };
  }

  const validado = rolUsuarioSchema.safeParse(rolNuevo);
  if (!validado.success) {
    return { ok: false, error: ERROR_ROL_INVALIDO };
  }
  const rol = validado.data;

  let antes: Role;
  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, activo: true },
      });
      if (!objetivo) {
        return { tipo: "no-encontrado" as const };
      }

      // Idempotent: it already has that role => no change, no log.
      if (objetivo.role === rol) {
        return { tipo: "sin-cambio" as const };
      }

      // Anti-lockout (c): do not demote the last active ADMIN.
      if (objetivo.role === "ADMIN" && objetivo.activo && rol !== "ADMIN") {
        const adminsActivos = await tx.user.count({
          where: { role: "ADMIN", activo: true },
        });
        if (adminsActivos <= 1) {
          return { tipo: "ultimo-admin" as const };
        }
      }

      // Update CONDITIONED on the role read (avoids races): if another process already
      // changed it, `count` will be 0 and we abort with a concurrency error.
      const afectadas = await tx.user.updateMany({
        where: { id, role: objetivo.role },
        data: { role: rol },
      });
      if (afectadas.count === 0) {
        return { tipo: "concurrencia" as const };
      }

      return { tipo: "cambiado" as const, antes: objetivo.role };
    });

    switch (resultado.tipo) {
      case "no-encontrado":
        return { ok: false, error: ERROR_NO_ENCONTRADO };
      case "sin-cambio":
        return { ok: true, cambiado: false };
      case "ultimo-admin":
        return { ok: false, error: ERROR_ULTIMO_ADMIN };
      case "concurrencia":
        return { ok: false, error: ERROR_CONCURRENCIA };
      case "cambiado":
        antes = resultado.antes;
        break;
    }
  } catch (error) {
    console.error("[admin/usuarios] cambiarRolUsuario:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  // Audit of the REAL change (no sensitive data).
  // TODO(auditoria): also persist it to a DB-backed AuditLog inside the tx.
  console.info(
    `[auditoria] actor=${actor.id} accion=cambiarRol objetivo=${id} antes=${antes} despues=${rol}`,
  );

  revalidatePath(RUTA_USUARIOS);
  return { ok: true, cambiado: true };
}

// ── MUTATION: activate / deactivate ───────────────────────────────────────────

/**
 * Activates or deactivates (soft delete of access) a user. Requires
 * "usuario:gestionarRol" (ADMIN ONLY).
 *
 * Rules:
 *  - Deactivating ONESELF => error "No puedes desactivar tu propia cuenta."
 *    (applies only when DEACTIVATING; reactivating oneself is harmless but is
 *    blocked all the same, being the same `id === actor` flow when `activo === false`).
 *  - Idempotent: if it is already in that state => { ok:true, cambiado:false } with no log.
 *  - If the target is an active ADMIN and is being deactivated (`activo === false`),
 *    the LAST active ADMIN guard is applied inside the tx.
 *  - Update CONDITIONED on the `activo` read; 0 rows => concurrency error.
 *
 * Returns { ok:true, cambiado } | { ok:false, error }.
 */
export async function cambiarActivoUsuario(
  id: string,
  activo: boolean,
): Promise<ResultadoMutacionUsuario> {
  let actor: UsuarioSesion;
  try {
    actor = await assertCan("usuario:gestionarRol");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  // Anti-lockout (b): nobody deactivates themselves.
  if (id === actor.id && activo === false) {
    return { ok: false, error: ERROR_PROPIA_CUENTA };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const objetivo = await tx.user.findUnique({
        where: { id },
        select: { id: true, role: true, activo: true },
      });
      if (!objetivo) {
        return { tipo: "no-encontrado" as const };
      }

      // Idempotent: it is already in that state => no change, no log.
      if (objetivo.activo === activo) {
        return { tipo: "sin-cambio" as const };
      }

      // Anti-lockout (c): do not deactivate the last active ADMIN.
      if (objetivo.role === "ADMIN" && objetivo.activo && activo === false) {
        const adminsActivos = await tx.user.count({
          where: { role: "ADMIN", activo: true },
        });
        if (adminsActivos <= 1) {
          return { tipo: "ultimo-admin" as const };
        }
      }

      // Update CONDITIONED on the `activo` read (avoids races).
      const afectadas = await tx.user.updateMany({
        where: { id, activo: objetivo.activo },
        data: { activo },
      });
      if (afectadas.count === 0) {
        return { tipo: "concurrencia" as const };
      }

      return { tipo: "cambiado" as const };
    });

    switch (resultado.tipo) {
      case "no-encontrado":
        return { ok: false, error: ERROR_NO_ENCONTRADO };
      case "sin-cambio":
        return { ok: true, cambiado: false };
      case "ultimo-admin":
        return { ok: false, error: ERROR_ULTIMO_ADMIN_ACTIVO };
      case "concurrencia":
        return { ok: false, error: ERROR_CONCURRENCIA };
      case "cambiado":
        break;
    }
  } catch (error) {
    console.error("[admin/usuarios] cambiarActivoUsuario:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  // Audit of the REAL change.
  // TODO(auditoria): also persist it to a DB-backed AuditLog inside the tx.
  console.info(
    `[auditoria] actor=${actor.id} accion=cambiarActivo objetivo=${id} antes=${!activo} despues=${activo}`,
  );

  revalidatePath(RUTA_USUARIOS);
  return { ok: true, cambiado: true };
}
