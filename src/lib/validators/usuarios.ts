/**
 * Validators and filters for the admin's USER MANAGEMENT (Zod 4) — PURE.
 *
 * Two responsibilities, with no Prisma or Next (only types, data and Zod):
 *  1) `parsearFiltrosUsuarios`: TOTAL parser for the users table, identical in
 *     spirit to `parsearFiltrosProductos`/`parsearFiltrosPedidos` in `admin.ts`:
 *     it NEVER throws; on an invalid value it falls back to the default. The
 *     URL/searchParams is the source of truth.
 *  2) `rolUsuarioSchema`: Zod enum of the 3 real roles, to validate the incoming
 *     role in the `cambiarRolUsuario` mutation (the boundary validates its input).
 *
 * It also exports the UI catalogs: `ROLES_FILTRO`, `ESTADOS_USUARIO_FILTRO`
 * and `ETIQUETA_ROL` (Spanish).
 */
import { z } from "zod";
import type { Role } from "@prisma/client";

// ── Real roles (the 3 in the Prisma enum) ────────────────────────────────────

/** The 3 roles of Prisma's `Role` enum, as a literal tuple for Zod. */
export const ROLES_USUARIO = [
  "CLIENTE",
  "VENDEDOR",
  "ADMIN",
] as const satisfies readonly Role[];

/**
 * Zod enum for the incoming role in the role-change mutation. Validates that the
 * `unknown` value arriving from the client is exactly one of the 3 roles.
 */
export const rolUsuarioSchema = z.enum(ROLES_USUARIO);

/** Validated role (same as `Role`, derived from the schema). */
export type RolUsuario = z.infer<typeof rolUsuarioSchema>;

/** Spanish label for each role (for the UI's selects/badges). */
export const ETIQUETA_ROL: Record<Role, string> = {
  CLIENTE: "Cliente",
  VENDEDOR: "Vendedor",
  ADMIN: "Administrador",
};

// ── Catalogs for the users DataTable filters ─────────────────────────────────

/**
 * Options for filtering by role: "todos" or one of the 3 roles. With their label for
 * the UI (the first value is the default).
 */
export const ROLES_FILTRO = [
  { value: "todos", label: "Todos los roles" },
  { value: "CLIENTE", label: "Cliente" },
  { value: "VENDEDOR", label: "Vendedor" },
  { value: "ADMIN", label: "Administrador" },
] as const;
export type RolFiltro = (typeof ROLES_FILTRO)[number]["value"];
const VALORES_ROL_FILTRO = ROLES_FILTRO.map((r) => r.value) as [
  RolFiltro,
  ...RolFiltro[],
];

/** Options of the account status filter. */
export const ESTADOS_USUARIO_FILTRO = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "inactivos", label: "Inactivos" },
] as const;
export type EstadoUsuarioFiltro = (typeof ESTADOS_USUARIO_FILTRO)[number]["value"];
const VALORES_ESTADO_USUARIO = ESTADOS_USUARIO_FILTRO.map((e) => e.value) as [
  EstadoUsuarioFiltro,
  ...EstadoUsuarioFiltro[],
];

// ── Total-parsing helpers (same pattern as `admin.ts`) ───────────────────────

/** Takes the first value if the searchParam came repeated (array). */
function primero(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/**
 * Retries a TOTAL schema: if the first parse fails, it removes the fields that
 * Zod flagged as invalid (each falls back to its default/omission) and retries.
 * The retry can no longer fail because the remaining fields are valid.
 */
function parseTotal<T>(schema: z.ZodType<T>, crudo: Record<string, unknown>): T {
  const intento = schema.safeParse(crudo);
  if (intento.success) return intento.data;

  const limpio: Record<string, unknown> = { ...crudo };
  for (const issue of intento.error.issues) {
    const campo = issue.path[0];
    if (typeof campo === "string") delete limpio[campo];
  }

  const reintento = schema.safeParse(limpio);
  if (reintento.success) return reintento.data;

  // Safeguard (should be unreachable): absolute defaults.
  return schema.parse({});
}

/** URL text field: trim, length cap, and "" -> undefined. */
function textoFiltro(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length > 0 ? v : undefined))
    .optional();
}

// ── Filters for the USERS DataTable (admin) ──────────────────────────────────

/**
 * Filter schema for the admin users table.
 * URL contract: ?q= rol= estado= page=
 *  - q: searches name / email (insensitive).
 *  - rol: "todos" | "CLIENTE" | "VENDEDOR" | "ADMIN" (default "todos").
 *  - estado: "todos" | "activos" | "inactivos" (default "todos").
 */
export const filtrosUsuariosAdminSchema = z.object({
  q: textoFiltro(120),
  rol: z.enum(VALORES_ROL_FILTRO).default("todos"),
  estado: z.enum(VALORES_ESTADO_USUARIO).default("todos"),
  page: z.coerce.number().int().min(1).default(1),
});

/** Admin user filters, already normalized (schema output). */
export type FiltrosUsuariosAdmin = z.infer<typeof filtrosUsuariosAdminSchema>;

/**
 * TOTAL parser from searchParams to `FiltrosUsuariosAdmin`. NEVER throws.
 */
export function parsearFiltrosUsuarios(
  sp: Record<string, string | string[] | undefined>,
): FiltrosUsuariosAdmin {
  return parseTotal(filtrosUsuariosAdminSchema, {
    q: primero(sp.q),
    rol: primero(sp.rol),
    estado: primero(sp.estado),
    page: primero(sp.page),
  });
}
