"use server";

// Server action for the PUBLIC contact form (NO session).
//
// Uniform return contract: { ok: true } | { ok: false, error: string }.
// GENERIC error message for the user; the technical detail only goes to the logs.
import { prisma } from "@/lib/prisma";
import {
  parsearContacto,
  CAMPO_HONEYPOT,
} from "@/lib/validators/contacto";

// Standard result of the action.
export type ResultadoContacto = { ok: true } | { ok: false; error: string };

// --- TODO: Rate limiting -----------------------------------------------------
// There is NO rate limiting INFRA YET. Once it exists (Upstash Ratelimit / Redis /
// IP middleware), wrap this action BEFORE processing:
//   const { success } = await ratelimit.limit(`contacto:${ip}`);
//   if (!success) return { ok: false, error: "Demasiados mensajes. Intenta más tarde." };
// Suggested: max ~5 submissions / hour per IP (public form, anti-spam).
// Get the request IP (x-forwarded-for headers) inside the action.
// -----------------------------------------------------------------------------

// --- TODO: Notification ------------------------------------------------------
// Once there is an email provider (see lib/mailer/), notify the business of
// every new message: send NEGOCIO.email an email with name/email/subject/
// message for follow-up. Do not block the response to the user if it fails.
// -----------------------------------------------------------------------------

/**
 * Receives and persists a message from the contact form.
 * - PUBLIC: requires no session.
 * - Validates with Zod (parsearContacto).
 * - HONEYPOT: if `apellido2` arrives with content, we treat it as a bot ->
 *   we answer { ok: true } WITHOUT persisting (we do not tip off the bot).
 * - GENERIC error on any failure; the detail goes to console.error (logs).
 */
export async function enviarMensajeContacto(
  formData: FormData,
): Promise<ResultadoContacto> {
  // TODO(rate-limit): apply a per-IP limit before processing (see the block above).

  // Honeypot: if the trap field carries content, it is almost certainly a bot.
  // We answer "ok" SILENTLY, without saving and without hints for the bot.
  const honeypot = formData.get(CAMPO_HONEYPOT);
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { ok: true };
  }

  const parsed = parsearContacto(formData);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const { nombre, email, asunto, mensaje } = parsed.data;

  // Generic message for the user on any persistence failure.
  const errorGenerico = "No pudimos enviar tu mensaje. Intenta de nuevo.";

  try {
    await prisma.mensajeContacto.create({
      data: {
        nombre,
        email: email.toLowerCase(),
        asunto: asunto ?? null,
        mensaje,
      },
      select: { id: true },
    });

    // TODO(notificacion): send an email to the business (see the block above).

    return { ok: true };
  } catch (error) {
    // The detail ONLY in the server logs; it is never exposed to the user.
    console.error("[contacto] Error al guardar mensaje de contacto:", error);
    return { ok: false, error: errorGenerico };
  }
}
