/**
 * Validator for the FORMDATA CONTRACT of the PUBLIC contact form (Zod 4).
 * UI -> server boundary: checks the shape and bounds lengths before touching the DB.
 *
 * Shape of the contract (FormData):
 *  - nombre:    string   2..80  (trim, required)
 *  - email:     string          (z.email, required)
 *  - asunto:    string?  <= 120 (optional; "" -> undefined)
 *  - mensaje:   string   10..2000 (trim, required)
 *  - apellido2: string?          (anti-bot HONEYPOT: MUST arrive empty)
 *
 * Honeypot: `apellido2` is a trap field hidden from humans. If it carries
 * content, it is almost certainly a bot. The schema rejects it, but the server
 * action handles it SILENTLY (it answers ok without persisting) to give no hints.
 */
import { z } from "zod";

/** Name of the trap field (hidden in the UI; a human never fills it in). */
export const CAMPO_HONEYPOT = "apellido2" as const;

export const contactoSchema = z.object({
  nombre: z
    .string({ error: "Escribe tu nombre." })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre es demasiado largo."),
  // .max: defense in depth — the action is public and the input's maxLength is
  // client-side only; without a cap, a direct POST would persist without limit.
  email: z
    .email("Ingresa un correo electrónico válido.")
    .max(120, "El correo es demasiado largo."),
  // Optional subject: "" is normalized to undefined after the trim.
  asunto: z
    .string()
    .trim()
    .max(120, "El asunto es demasiado largo.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  mensaje: z
    .string({ error: "Escribe tu mensaje." })
    .trim()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(2000, "El mensaje es demasiado largo."),
  // HONEYPOT: must arrive empty. Accepts absence ("" / undefined) and rejects it
  // if it carries any content. The message is internal: the server does not show it.
  [CAMPO_HONEYPOT]: z
    .string()
    .trim()
    .max(0, "Mensaje rechazado.")
    .optional(),
});

/** Contact data already validated and normalized (schema output). */
export type ContactoValidado = z.infer<typeof contactoSchema>;

/**
 * Reads a FormData field as a string (or `undefined` if it is missing or is a File).
 */
function leerCampo(form: FormData, clave: string): string | undefined {
  const valor = form.get(clave);
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Validates the contact form's FormData.
 *
 * @returns `{ ok: true, data }` with the validated data (honeypot included so
 *          that the server decides), or `{ ok: false, error }` with the FIRST
 *          error message in Spanish, suitable for the user.
 */
export function parsearContacto(
  formData: FormData,
): { ok: true; data: ContactoValidado } | { ok: false; error: string } {
  const parsed = contactoSchema.safeParse({
    nombre: leerCampo(formData, "nombre"),
    email: leerCampo(formData, "email"),
    asunto: leerCampo(formData, "asunto"),
    mensaje: leerCampo(formData, "mensaje"),
    [CAMPO_HONEYPOT]: leerCampo(formData, CAMPO_HONEYPOT),
  });

  if (parsed.success) return { ok: true, data: parsed.data };

  const primero = parsed.error.issues[0];
  const error = primero?.message ?? "Revisa los datos del formulario.";
  return { ok: false, error };
}
