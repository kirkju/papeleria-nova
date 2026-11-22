// NextAuth (Auth.js) v5 entry point.
// Exports { auth, signIn, signOut, handlers } built from the configuration.
//
// - `auth`     -> reads the session in server components / server actions and acts as
//                 the wrapper in src/proxy.ts (Next 16 Node middleware).
// - `signIn`   -> signs in (credentials provider) from server actions.
// - `signOut`  -> signs out.
// - `handlers` -> { GET, POST } mounted at /api/auth/[...nextauth]/route.ts.
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/config";

export const { auth, signIn, signOut, handlers } = NextAuth(authConfig);
