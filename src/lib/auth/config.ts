// NextAuth (Auth.js) v5 configuration for Papelería Nova.
//
// - Session strategy: pure JWT (sessions are not persisted in the DB; the Prisma
//   schema leaves out Account/Session/VerificationToken by project decision).
// - Credentials provider: validates the input with Zod, looks the user up by email
//   (explicit select that DOES fetch passwordHash, only to compare) and verifies the
//   hash with bcryptjs. The passwordHash is never returned to the token/session.
// - jwt/session callbacks: propagate `id` and `role` (source of truth: Prisma's Role enum).
// - OAuth (Google): structure ready but commented out. Enabling it requires the PrismaAdapter
//   + Account/Session tables (see the TODO in schema.prisma) or keeping JWT with manual linking.
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
// import Google from "next-auth/providers/google"; // Optional OAuth, see the note below.
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Schema of the login input. We validate the basic shape; we do NOT reveal whether the
// email exists or whether the password is what failed (generic messages on the client).
const credencialesSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const authConfig: NextAuthConfig = {
  // Session based on a signed JWT (no sessions table).
  session: { strategy: "jwt" },
  // Custom pages (styled on the design side). The login error is shown on /login.
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      // These fields only document the provider; the real form is custom.
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(rawCredentials) {
        // 1. Validate the shape of the input. If it fails, invalid login (no details).
        const parsed = credencialesSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 2. Look up the user. Explicit SELECT: only what is needed + passwordHash
        //    (used solely to compare and never propagated to the token/session).
        const usuario = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          select: {
            id: true,
            email: true,
            nombre: true,
            role: true,
            activo: true,
            passwordHash: true,
          },
        });

        // 3. Nonexistent or deactivated user -> invalid credentials (generic).
        //    We still run a "dummy" compare to mitigate timing attacks that
        //    could tell existing emails from nonexistent ones.
        if (!usuario || !usuario.activo) {
          await bcrypt.compare(
            password,
            "$2a$10$abcdefghijklmnopqrstuv0123456789ABCDEFGHIJKLMNOPQRSTUV",
          );
          return null;
        }

        // 4. Compare the password against the bcrypt hash.
        const passwordValida = await bcrypt.compare(
          password,
          usuario.passwordHash,
        );
        if (!passwordValida) return null;

        // 5. Return ONLY public data. The passwordHash is dropped here.
        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          role: usuario.role,
        };
      },
    }),
    // --- OAuth with Google (optional, structure left ready) ---
    // To enable it:
    //  1. Define AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in .env (they are already
    //     commented out in .env.example). NextAuth v5 infers them automatically.
    //  2. Uncomment the import above and the line below.
    //  3. With a pure JWT strategy, handle the default `role` in the `jwt`
    //     callback (a new OAuth user will have no row in User; decide whether it
    //     is created on the fly or prior registration is required). To persist
    //     accounts, add the PrismaAdapter + Account/Session models (TODO in the schema).
    // Google,
  ],
  callbacks: {
    // Propagates id and role to the token the first time (when `user` is present).
    async jwt({ token, user }) {
      // `user` is only present on the first login. Its `id` is optional in the
      // NextAuth base type, but our `authorize` always returns it.
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    // Exposes id and role on the session (ALWAYS read from the server, never from the client).
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
