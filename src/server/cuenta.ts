"use server";

/**
 * Server actions for the user's ACCOUNT AREA (profile, orders, addresses).
 *
 * Golden rules of this module (non-negotiable):
 * - Authorization ALWAYS on the server. Everything operates on the SESSION's
 *   `userId`; the client NEVER decides whose data it is.
 *     · reads (Server Components): `assertCan(...)` lets the `AuthError`
 *       PROPAGATE so that the page shows a 403.
 *     · mutations: the `AuthError` is caught -> `{ ok: false, error }`.
 * - EXPLICIT `select` in everything that returns user data: `passwordHash` is
 *   NEVER included in DTOs or logs. The passwordHash is ONLY read inside
 *   `cambiarPassword` for the `bcrypt.compare` (just as the login does).
 * - `Decimal`/`Date` do NOT cross to the client: the DTOs return `number` and
 *   dates in ISO 8601.
 * - User-readable messages; the technical detail only in `console.error`.
 * - Passwords are NEVER logged (neither in plain text nor hashed).
 *
 * It does NOT duplicate existing reads: the address LIST is served by
 * `obtenerDireccionesUsuario()` from `@/server/direcciones`, and the DETAIL of
 * an order by `obtenerPedidoPorNumero()` from `@/server/pedidos`.
 */
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan, AuthError } from "@/lib/auth/guard";
import {
  parsearPerfil,
  parsearCambioPassword,
  TAMANO_PAGINA_PEDIDOS,
} from "@/lib/validators/cuenta";

// bcrypt cost (>= 10 per the project's security rule; same as registration).
const BCRYPT_COST = 10;

// ── Results / DTOs (serializable) ─────────────────────────────────────────────

/** Standard result of the account mutations. */
export type ResultadoCuenta = { ok: true } | { ok: false; error: string };

/** Row of the user's order list (serializable). */
export type MiPedidoFila = {
  numero: string;
  estado: OrderStatus;
  /** Order total in Lempiras. */
  total: number;
  /** Sum of the units of all the lines. */
  totalItems: number;
  /** Creation date in ISO 8601. */
  creadoEn: string;
};

/** Paginated list of the user's orders. */
export type MisPedidos = {
  pedidos: MiPedidoFila[];
  /** Total number of orders of the user (all pages). */
  total: number;
  /** Current page (>= 1). */
  pagina: number;
  /** Total number of pages (at least 1, even with no orders). */
  totalPaginas: number;
};

/** The user's profile data (no sensitive fields). */
export type PerfilUsuario = {
  nombre: string;
  email: string;
  /** Account sign-up date in ISO 8601. */
  creadoEn: string;
  totalPedidos: number;
  totalDirecciones: number;
};

// ── Messages (in Spanish, without leaking details) ───────────────────────────

const ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";
const ERROR_PERFIL_NO_DISPONIBLE = "No pudimos cargar tu perfil.";
// Generic message for the password change: it does NOT confirm which value failed (nor
// whether the current password was correct) — same spirit as the login messages.
const ERROR_CAMBIO_PASSWORD =
  "No se pudo cambiar la contraseña. Verifica tus datos.";
const ERROR_DIRECCION_NO_ENCONTRADA =
  "No encontramos esa dirección o no es tuya.";

// ── READ: the user's order list ───────────────────────────────────────────────

/**
 * Paginated list of the SESSION user's orders (10/page, most recent
 * first). Requires "pedido:verPropios" (CLIENTE|VENDEDOR|ADMIN). Throws
 * `AuthError` if there is no session / role (the page catches it -> 403).
 *
 * `count` and `findMany` run in a `Promise.all`. `totalPaginas` is at least 1.
 *
 * @param page requested page (>= 1, already normalized by `parsearPaginaPedidos`).
 */
export async function misPedidos(page = 1): Promise<MisPedidos> {
  const user = await assertCan("pedido:verPropios");

  const pagina = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  const take = TAMANO_PAGINA_PEDIDOS;
  const skip = (pagina - 1) * take;

  const where: Prisma.OrderWhereInput = { userId: user.id };

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        numero: true,
        estado: true,
        total: true,
        createdAt: true,
        items: { select: { cantidad: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / take));

  return {
    pedidos: rows.map((p) => ({
      numero: p.numero,
      estado: p.estado,
      total: Number(p.total),
      totalItems: p.items.reduce((acc, i) => acc + i.cantidad, 0),
      creadoEn: p.createdAt.toISOString(),
    })),
    total,
    pagina,
    totalPaginas,
  };
}

// ── READ: the user's profile ──────────────────────────────────────────────────

/**
 * Returns the SESSION user's profile, with order and address counts.
 * Requires "perfil:editar". Explicit `select` WITHOUT `passwordHash`.
 * Throws `AuthError` if there is no session / role; throws if the user does not
 * exist in the DB (anomalous case: a valid session pointing to a deleted user).
 */
export async function obtenerPerfil(): Promise<PerfilUsuario> {
  const user = await assertCan("perfil:editar");

  const fila = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      nombre: true,
      email: true,
      createdAt: true,
      _count: { select: { pedidos: true, direcciones: true } },
    },
  });

  if (!fila) {
    // Valid session but the user no longer exists in the DB: not an expected case.
    console.error("[cuenta] obtenerPerfil: usuario de sesión inexistente", {
      userId: user.id,
    });
    throw new Error(ERROR_PERFIL_NO_DISPONIBLE);
  }

  return {
    nombre: fila.nombre,
    email: fila.email,
    creadoEn: fila.createdAt.toISOString(),
    totalPedidos: fila._count.pedidos,
    totalDirecciones: fila._count.direcciones,
  };
}

// ── MUTATION: update name ─────────────────────────────────────────────────────

/**
 * Updates the SESSION user's name. Requires "perfil:editar".
 *
 * NOTE: the change shows up in the account pages (they read the DB), but the header
 * uses the name from the session JWT, which is NOT refreshed until the next login.
 * TODO(unstable_update): once NextAuth v5's `unstable_update` is adopted,
 * also update the session token so that it shows without a re-login.
 *
 * Changing the EMAIL is OUT of scope (it requires verifying the new
 * address). TODO(cambio-email): token-based verification flow.
 *
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
export async function actualizarNombre(
  formData: FormData,
): Promise<ResultadoCuenta> {
  let userId: string;
  try {
    const user = await assertCan("perfil:editar");
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    throw error;
  }

  const parsed = parsearPerfil(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { nombre: parsed.data.nombre },
      select: { id: true }, // never return passwordHash
    });
  } catch (error) {
    console.error("[cuenta] actualizarNombre:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/cuenta");
  return { ok: true };
}

// ── MUTATION: change password ─────────────────────────────────────────────────

/**
 * Changes the SESSION user's password. Requires "perfil:editar".
 *
 * Flow:
 *  - Validates the FormData (actual, nueva, confirmacion). nueva === confirmacion or
 *    error "Las contraseñas no coinciden.".
 *  - Reads ONLY the `passwordHash` (minimal select) to compare with `bcrypt.compare`
 *    against the CURRENT password.
 *  - If the current one does not match => GENERIC error `ERROR_CAMBIO_PASSWORD`
 *    (which field failed is not confirmed, same spirit as the login).
 *  - If the new one is THE SAME as the current one => same neutral generic error
 *    (changing it to itself adds no security; reusing the generic one avoids
 *    leaking that the current one WAS correct).
 *  - Hashes the new one (cost 10) and updates.
 *  - Audit with `console.info` WITHOUT passwords.
 *
 * It does NOT close other active sessions: with pure JWT there is no revocation.
 * TODO(revocacion): invalidate existing sessions after the change (requires
 * versioning the token or persisting sessions; already documented at project level).
 *
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
export async function cambiarPassword(
  formData: FormData,
): Promise<ResultadoCuenta> {
  let userId: string;
  try {
    const user = await assertCan("perfil:editar");
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    throw error;
  }

  const parsed = parsearCambioPassword(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  const { actual, nueva } = parsed.data;

  try {
    // MINIMAL SELECT: only the passwordHash, exclusively to compare.
    const fila = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    // Nonexistent session user (anomalous) => generic, no hints.
    if (!fila) {
      return { ok: false, error: ERROR_CAMBIO_PASSWORD };
    }

    // Verify the CURRENT password. Failure => generic (does not confirm the field).
    const actualValida = await bcrypt.compare(actual, fila.passwordHash);
    if (!actualValida) {
      return { ok: false, error: ERROR_CAMBIO_PASSWORD };
    }

    // New one equal to the current one: pointless. Same neutral generic message (we do
    // not confirm that the current one was correct beyond this message).
    const nuevaIgualActual = await bcrypt.compare(nueva, fila.passwordHash);
    if (nuevaIgualActual) {
      return { ok: false, error: ERROR_CAMBIO_PASSWORD };
    }

    const passwordHash = await bcrypt.hash(nueva, BCRYPT_COST);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: { id: true }, // never return passwordHash
    });
  } catch (error) {
    // The detail ONLY in the logs; passwords are never logged.
    console.error("[cuenta] cambiarPassword:", error);
    return { ok: false, error: ERROR_CAMBIO_PASSWORD };
  }

  // Audit: NO passwords or hashes, only actor and action.
  console.info(`[auditoria] actor=${userId} accion=cambiarPassword`);

  return { ok: true };
}

// ── MUTATION: delete address ──────────────────────────────────────────────────

/**
 * Deletes an address of the SESSION user. Requires "perfil:editar".
 *
 * - `deleteMany({ id, userId })`: SCOPED to the user. If `count === 0` (it does not
 *   exist or is not theirs) => generic error (someone else's existence is not leaked).
 * - If the deleted one was the DEFAULT and other addresses remain, it promotes the
 *   most recent one (highest id) to default, in the SAME transaction.
 * - Revalidates /cuenta.
 *
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
export async function eliminarDireccion(
  id: string,
): Promise<ResultadoCuenta> {
  let userId: string;
  try {
    const user = await assertCan("perfil:editar");
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    throw error;
  }

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: ERROR_DIRECCION_NO_ENCONTRADA };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      // Read the scoped address (to know whether it was the default before deleting).
      const objetivo = await tx.address.findFirst({
        where: { id, userId },
        select: { id: true, esPredeterminada: true },
      });
      if (!objetivo) {
        return { tipo: "no_encontrada" as const };
      }

      await tx.address.delete({ where: { id: objetivo.id } });

      // If it was the default and others remain, promote the most recent one.
      if (objetivo.esPredeterminada) {
        const siguiente = await tx.address.findFirst({
          where: { userId },
          orderBy: { id: "desc" },
          select: { id: true },
        });
        if (siguiente) {
          await tx.address.update({
            where: { id: siguiente.id },
            data: { esPredeterminada: true },
          });
        }
      }

      return { tipo: "ok" as const };
    });

    if (resultado.tipo === "no_encontrada") {
      return { ok: false, error: ERROR_DIRECCION_NO_ENCONTRADA };
    }
  } catch (error) {
    console.error("[cuenta] eliminarDireccion:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/cuenta");
  return { ok: true };
}

// ── MUTATION: set the default address ─────────────────────────────────────────

/**
 * Marks an address of the SESSION user as the default. Requires
 * "perfil:editar".
 *
 * Transaction: verifies ownership (`{ id, userId }`); sets ALL of the user's
 * to `false` and then the chosen one to `true`. If it does not exist / is not
 * theirs => generic error. Revalidates /cuenta.
 *
 * @returns `{ ok: true }` or `{ ok: false, error }`.
 */
export async function marcarDireccionPredeterminada(
  id: string,
): Promise<ResultadoCuenta> {
  let userId: string;
  try {
    const user = await assertCan("perfil:editar");
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    throw error;
  }

  if (typeof id !== "string" || id.length === 0) {
    return { ok: false, error: ERROR_DIRECCION_NO_ENCONTRADA };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const objetivo = await tx.address.findFirst({
        where: { id, userId },
        select: { id: true },
      });
      if (!objetivo) {
        return { tipo: "no_encontrada" as const };
      }

      // Unmark all of the user's and mark the chosen one (scoped by userId).
      await tx.address.updateMany({
        where: { userId },
        data: { esPredeterminada: false },
      });
      await tx.address.update({
        where: { id: objetivo.id },
        data: { esPredeterminada: true },
      });

      return { tipo: "ok" as const };
    });

    if (resultado.tipo === "no_encontrada") {
      return { ok: false, error: ERROR_DIRECCION_NO_ENCONTRADA };
    }
  } catch (error) {
    console.error("[cuenta] marcarDireccionPredeterminada:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  revalidatePath("/cuenta");
  return { ok: true };
}
