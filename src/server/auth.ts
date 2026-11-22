"use server";

// Authentication server actions: registration and sign-in.
//
// Uniform return contract: { ok: true } | { ok: false, error: string }.
// GENERIC error messages so as not to leak whether an email exists.
// Passwords are handled only as bcrypt hashes (cost 10) and are NEVER logged.
import bcrypt from "bcryptjs";
import { z } from "zod";
import { AuthError as NextAuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";

// bcrypt cost (>= 10 per the project's security rule).
const BCRYPT_COST = 10;

// Standard result of the actions.
export type ResultadoAuth = { ok: true } | { ok: false; error: string };

// --- TODO: Rate limiting -----------------------------------------------------
// There is NO rate limiting INFRA YET. Once it exists (Upstash Ratelimit / Redis /
// IP middleware), wrap login and registration:
//   const { success } = await ratelimit.limit(`auth:${ip}`);
//   if (!success) return { ok: false, error: "Demasiados intentos. Intenta más tarde." };
// Suggested: max ~5 attempts / 10 min per IP+email on login; ~3 registrations / hour per IP.
// Get the request IP (x-forwarded-for headers) inside the action.
// -----------------------------------------------------------------------------

// === Registration ============================================================

const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres.")
    .max(80, "El nombre es demasiado largo."),
  email: z.email("Ingresa un correo electrónico válido."),
  // "Strong" password: minimum 8, with at least one letter and one number.
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(72, "La contraseña es demasiado larga.") // bcrypt's effective limit
    .refine(
      (v) => /[A-Za-z]/.test(v) && /\d/.test(v),
      "La contraseña debe incluir al menos una letra y un número.",
    ),
});

/**
 * Registers a new user with the CLIENTE role.
 * - Validates with Zod (name, unique email, strong password).
 * - Hashes with bcrypt (cost 10).
 * - GENERIC error if the email already exists (it does not confirm its existence).
 */
export async function registrarUsuario(
  formData: FormData,
): Promise<ResultadoAuth> {
  // TODO(rate-limit): apply a per-IP limit before processing (see the block above).

  const parsed = registroSchema.safeParse({
    nombre: formData.get("nombre"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    // First validation message (enough for the form).
    const primer = parsed.error.issues[0]?.message ?? "Datos inválidos.";
    return { ok: false, error: primer };
  }

  const { nombre, email, password } = parsed.data;
  const emailNormalizado = email.toLowerCase();

  // Common generic message for "the account could not be created".
  const errorGenerico =
    "No se pudo crear la cuenta. Verifica los datos e intenta de nuevo.";

  try {
    const existente = await prisma.user.findUnique({
      where: { email: emailNormalizado },
      select: { id: true },
    });
    // Email already registered -> we do NOT confirm it explicitly.
    if (existente) {
      return { ok: false, error: errorGenerico };
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    await prisma.user.create({
      data: {
        nombre,
        email: emailNormalizado,
        passwordHash,
        role: "CLIENTE",
      },
      select: { id: true }, // never return passwordHash
    });

    return { ok: true };
  } catch {
    // Do not leak error details (it may be a unique-email race, etc.).
    return { ok: false, error: errorGenerico };
  }
}

// === Sign-out ================================================================

/**
 * Closes the current session and redirects to the home page.
 * Meant to be used as the action of a <form> (e.g. the "Salir" button in the header).
 */
export async function cerrarSesion(): Promise<void> {
  await signOut({ redirectTo: "/" });
}

// === Sign-in =================================================================

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

/**
 * Signs in with credentials.
 * - Does not redirect automatically (redirect:false): the page decides the destination.
 * - GENERIC error on any credentials failure (it does not leak whether the email exists).
 */
export async function iniciarSesion(
  formData: FormData,
): Promise<ResultadoAuth> {
  // TODO(rate-limit): apply a per-IP+email limit before attempting (see the block above).

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  const errorGenerico = "Credenciales inválidas.";

  if (!parsed.success) {
    return { ok: false, error: errorGenerico };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
      redirect: false,
    });
    return { ok: true };
  } catch (error) {
    // CredentialsSignin (and any NextAuth AuthError) -> generic message.
    if (error instanceof NextAuthError) {
      return { ok: false, error: errorGenerico };
    }
    // Unexpected errors: rethrow so that Next logs them (without exposing them here).
    throw error;
  }
}
