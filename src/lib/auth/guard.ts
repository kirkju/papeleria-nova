// Authorization helpers — authorization lives on the SERVER, always.
//
// Use them in EVERY server action / route handler that reads or mutates protected data.
// The role is read from the server session (`auth()`), never from anything the
// client sends. The UI may hide buttons, but the hard barrier is here.
//
// Recommended pattern in a server action:
//
//   try {
//     await assertCan("producto:crear");
//     // ...mutation...
//     return { ok: true } as const;
//   } catch (e) {
//     if (e instanceof AuthError) return { ok: false, error: e.mensajePublico } as const;
//     throw e;
//   }
import type { Role } from "@prisma/client";
import { auth } from "@/lib/auth";

/** Session user (the minimal shape we expose from the server). */
export interface UsuarioSesion {
  id: string;
  role: Role;
  email?: string | null;
  name?: string | null;
}

// --- Authorization errors ----------------------------------------------------

/** Stable codes to tell "not signed in" from "signed in without permission". */
export type AuthErrorCode = "NO_AUTENTICADO" | "NO_AUTORIZADO";

/**
 * Authorization error. Catch it at the boundary (server action -> { ok:false },
 * page -> 403). The public message is generic so that no details leak.
 */
export class AuthError extends Error {
  readonly code: AuthErrorCode;
  /** Message that is safe to show to the end user (in Spanish). */
  readonly mensajePublico: string;

  constructor(code: AuthErrorCode) {
    const mensajePublico =
      code === "NO_AUTENTICADO"
        ? "Debes iniciar sesión para continuar."
        : "No tienes permiso para realizar esta acción.";
    super(code);
    this.name = "AuthError";
    this.code = code;
    this.mensajePublico = mensajePublico;
  }
}

// --- Permission matrix (RBAC) ------------------------------------------------
//
// Each permission is a "resource:action" string literal. The value is the set of
// authorized roles. Only actions that require CLIENTE+ are listed (the "guest"
// actions — browsing the catalog, filling a cart — need no role guard).

/** Union of valid permissions. Typing it this way prevents typos in assertCan calls. */
export type Permiso =
  // Customer and above
  | "pedido:crear" // checkout / create an order
  | "pedido:verPropios" // view their own orders
  | "perfil:editar" // edit their profile
  // Seller and above
  | "pedido:verTodos" // view ALL orders
  | "pedido:cambiarEstado" // change an order's status
  | "inventario:ver" // view the inventory
  | "inventario:ajustarStock" // adjust stock
  | "dashboard:ventas" // sales dashboard
  // Admin only
  | "producto:crear" // create a product
  | "producto:editar" // edit a product
  | "producto:desactivar" // delete (deactivate) a product
  | "categoria:gestionar" // category CRUD
  | "usuario:listar" // list users
  | "usuario:gestionarRol" // change role / activate a user
  | "dashboard:completo"; // global metrics

const CLIENTE_Y_MAS: readonly Role[] = ["CLIENTE", "VENDEDOR", "ADMIN"];
const VENDEDOR_Y_MAS: readonly Role[] = ["VENDEDOR", "ADMIN"];
const SOLO_ADMIN: readonly Role[] = ["ADMIN"];

/** Roles allowed for each permission. This is the project's RBAC matrix. */
export const PERMISOS: Record<Permiso, readonly Role[]> = {
  "pedido:crear": CLIENTE_Y_MAS,
  "pedido:verPropios": CLIENTE_Y_MAS,
  "perfil:editar": CLIENTE_Y_MAS,

  "pedido:verTodos": VENDEDOR_Y_MAS,
  "pedido:cambiarEstado": VENDEDOR_Y_MAS,
  "inventario:ver": VENDEDOR_Y_MAS,
  "inventario:ajustarStock": VENDEDOR_Y_MAS,
  "dashboard:ventas": VENDEDOR_Y_MAS,

  "producto:crear": SOLO_ADMIN,
  "producto:editar": SOLO_ADMIN,
  "producto:desactivar": SOLO_ADMIN,
  "categoria:gestionar": SOLO_ADMIN,
  "usuario:listar": SOLO_ADMIN,
  "usuario:gestionarRol": SOLO_ADMIN,
  "dashboard:completo": SOLO_ADMIN,
};

// --- Helpers -----------------------------------------------------------------

/**
 * Returns the user of the current session, or `null` if there is no session.
 * Does not throw: use it for optional branches (e.g. showing a "sign in" link).
 */
export async function getCurrentUser(): Promise<UsuarioSesion | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Requires a session and that the role is in `roles`. Throws `AuthError`:
 *  - NO_AUTENTICADO if there is no session.
 *  - NO_AUTORIZADO if the role is not allowed.
 * Returns the user for chaining.
 */
export async function requireRole(
  roles: readonly Role[],
): Promise<UsuarioSesion> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("NO_AUTENTICADO");
  if (!roles.includes(user.role)) throw new AuthError("NO_AUTORIZADO");
  return user;
}

/**
 * Requires the current user to hold the given `permiso` per the RBAC matrix.
 * Throws `AuthError` if there is no session or the role falls short. Returns the user.
 */
export async function assertCan(permiso: Permiso): Promise<UsuarioSesion> {
  return requireRole(PERMISOS[permiso]);
}

/**
 * Boolean variant of `assertCan` for UI/logic branches (does not throw).
 * Remember: hiding UI is NOT security; still validate with assertCan in the mutation.
 */
export async function can(permiso: Permiso): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return PERMISOS[permiso].includes(user.role);
}
