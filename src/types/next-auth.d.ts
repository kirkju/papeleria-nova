// NextAuth (Auth.js) type augmentation for Papelería Nova.
// Adds `id` and `role` to the session and the JWT. The source of truth for the
// role is Prisma's `Role` enum; the union is NOT redeclared by hand.
import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * The `user` object that reaches the `jwt`/`session` callbacks and the one
   * `authorize` returns in the credentials provider.
   */
  interface User {
    role: Role;
  }

  /**
   * Shape of the session available via `auth()` / `useSession()`.
   * `session.user.role` is propagated from the token in the `session` callback.
   */
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

// The `session` callback types its `token` from `@auth/core/jwt` (the canonical
// module that `next-auth/jwt` re-exports). We augment BOTH so that `token.id`
// and `token.role` are typed both in the callback and when importing from next-auth/jwt.
declare module "@auth/core/jwt" {
  /** Custom JWT claims: the user's identifier and role. */
  interface JWT {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
