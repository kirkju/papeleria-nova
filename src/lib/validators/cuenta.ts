/**
 * Validators for the user's ACCOUNT AREA (Zod 4) — PURE (no Prisma, no Next).
 *
 * Responsibilities:
 *  1) `parsearPerfil(formData)`     — update the profile name.
 *  2) `parsearCambioPassword(formData)` — password change (current + new +
 *     confirmation), with the SAME strength rules as registration.
 *  3) `parsearPaginaPedidos(sp)`    — TOTAL parser for the `?page=` of the user's
 *     order list (NEVER throws; on an invalid value it falls back to 1).
 *
 * The FormData parsers return `{ ok: true, data } | { ok: false, error }`
 * with the FIRST message in Spanish (same pattern as `parsearContacto` /
 * `parsearCheckout`). The technical detail is never exposed.
 *
 * IMPORTANT (source of truth for password strength):
 *   The `passwordNuevaSchema` rules are deliberately DUPLICATED from
 *   `registroSchema.password` in `src/server/auth.ts` (min 8, max 72, at least
 *   one letter and one number). They are kept identical on purpose: if the
 *   registration rules change, update BOTH so they do not diverge.
 */
import { z } from "zod";

// ── Name ─────────────────────────────────────────────────────────────────────

/**
 * Profile name. Same criterion as registration (`registroSchema.nombre` in
 * `src/server/auth.ts`): trim + 2..80 characters.
 */
export const nombreSchema = z
  .string({ error: "Escribe tu nombre." })
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres.")
  .max(80, "El nombre es demasiado largo.");

// ── Passwords ────────────────────────────────────────────────────────────────

/**
 * CURRENT password: we only require it to be present (min 1). Strength is not
 * revalidated here — the real check is the server's `bcrypt.compare`. The message
 * is neutral so as not to hint at which field failed.
 */
export const passwordActualSchema = z
  .string({ error: "Datos incompletos." })
  .min(1, "Datos incompletos.");

/**
 * NEW password. Rules IDENTICAL to `registroSchema.password` in
 * `src/server/auth.ts` (do NOT diverge): min 8, max 72 (bcrypt's effective limit),
 * and at least one letter and one number.
 */
export const passwordNuevaSchema = z
  .string({ error: "La contraseña es obligatoria." })
  .min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(72, "La contraseña es demasiado larga.") // bcrypt's effective limit
  .refine(
    (v) => /[A-Za-z]/.test(v) && /\d/.test(v),
    "La contraseña debe incluir al menos una letra y un número.",
  );

// ── Composite FormData schemas ───────────────────────────────────────────────

/** Schema of the profile form (name only for now; the email is handled separately). */
export const perfilSchema = z.object({
  nombre: nombreSchema,
});

/** Profile data already validated and normalized (schema output). */
export type PerfilValidado = z.infer<typeof perfilSchema>;

/**
 * Schema of the password change. The new === confirmation equality is validated
 * with `.refine` and the error is anchored to the `confirmacion` field so that it
 * is the FIRST readable issue. Literal message: "Las contraseñas no coinciden."
 */
export const cambioPasswordSchema = z
  .object({
    actual: passwordActualSchema,
    nueva: passwordNuevaSchema,
    confirmacion: z
      .string({ error: "Confirma tu nueva contraseña." })
      .min(1, "Confirma tu nueva contraseña."),
  })
  .refine((d) => d.nueva === d.confirmacion, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmacion"],
  });

/** Password change data already validated (schema output). */
export type CambioPasswordValidado = z.infer<typeof cambioPasswordSchema>;

// ── FormData reading helpers ─────────────────────────────────────────────────

/** Reads a FormData field as a string (or `undefined` if it is missing or is a File). */
function leerCampo(form: FormData, clave: string): string | undefined {
  const valor = form.get(clave);
  return typeof valor === "string" ? valor : undefined;
}

// ── FormData parsers ─────────────────────────────────────────────────────────

/**
 * Validates the profile form's FormData.
 *
 * @returns `{ ok: true, data }` with the validated name, or `{ ok: false, error }`
 *          with the FIRST message in Spanish, suitable for the user.
 */
export function parsearPerfil(
  formData: FormData,
): { ok: true; data: PerfilValidado } | { ok: false; error: string } {
  const parsed = perfilSchema.safeParse({
    nombre: leerCampo(formData, "nombre"),
  });

  if (parsed.success) return { ok: true, data: parsed.data };

  const primero = parsed.error.issues[0];
  const error = primero?.message ?? "Revisa los datos del formulario.";
  return { ok: false, error };
}

/**
 * Validates the password change FormData.
 *
 * Expected fields: `actual`, `nueva`, `confirmacion`. If the new password and the
 * confirmation do not match, the error is "Las contraseñas no coinciden.".
 *
 * @returns `{ ok: true, data }` with the three validated fields, or
 *          `{ ok: false, error }` with the FIRST message in Spanish.
 */
export function parsearCambioPassword(
  formData: FormData,
): { ok: true; data: CambioPasswordValidado } | { ok: false; error: string } {
  const parsed = cambioPasswordSchema.safeParse({
    actual: leerCampo(formData, "actual"),
    nueva: leerCampo(formData, "nueva"),
    confirmacion: leerCampo(formData, "confirmacion"),
  });

  if (parsed.success) return { ok: true, data: parsed.data };

  const primero = parsed.error.issues[0];
  const error = primero?.message ?? "Revisa los datos del formulario.";
  return { ok: false, error };
}

// ── Pagination of the user's order list ──────────────────────────────────────

/** Orders per page in the list of the user's account. */
export const TAMANO_PAGINA_PEDIDOS = 10;

/** Takes the first value if the searchParam came repeated (array). */
function primero(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/**
 * Schema for the `?page=` of the order list. Coerces to an integer >= 1; any
 * invalid value (text, 0, negatives, empty) falls back to the default 1.
 */
const paginaPedidosSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
});

/**
 * TOTAL parser for the searchParams of the order list. NEVER throws: on an
 * invalid `page` it returns `{ page: 1 }`. The URL is the source of truth.
 */
export function parsearPaginaPedidos(
  sp: Record<string, string | string[] | undefined>,
): { page: number } {
  const intento = paginaPedidosSchema.safeParse({ page: primero(sp.page) });
  if (intento.success) return intento.data;
  // invalid `page` -> omit it so that it takes the default (1).
  return paginaPedidosSchema.parse({});
}
