// Next 16 proxy (middleware) — ALWAYS runs on the Node.js runtime.
// In Next 16 the old `middleware.ts` is deprecated; the correct file is
// `src/proxy.ts` with an `export default` or a named `proxy` function.
//
// First UX barrier (every server action repeats the HARD validation):
//  - /admin/**  -> requires a session with the VENDEDOR or ADMIN role.
//      · no session                    -> /login?callbackUrl=<destination>
//      · session without a valid role  -> /no-autorizado (403)
//  - /cuenta/** -> requires any session.
//      · no session                    -> /login?callbackUrl=<destination>
//
// We use NextAuth v5's `auth()` wrapper: it injects `req.auth` with the session.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const ROLES_ADMIN: readonly string[] = ["VENDEDOR", "ADMIN"];

export default auth((req) => {
  const { nextUrl } = req;
  const sesion = req.auth;
  const estaLogueado = Boolean(sesion?.user);
  const rol = sesion?.user?.role;

  const path = nextUrl.pathname;
  const esRutaAdmin = path.startsWith("/admin");
  const esRutaCuenta = path.startsWith("/cuenta");

  // No session on any protected route -> to login with callbackUrl.
  if (!estaLogueado && (esRutaAdmin || esRutaCuenta)) {
    const urlLogin = new URL("/login", nextUrl.origin);
    // Keeps path + query to come back after authenticating.
    urlLogin.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(urlLogin);
  }

  // Signed in but the role is not enough for /admin -> 403.
  if (esRutaAdmin && estaLogueado && !ROLES_ADMIN.includes(rol ?? "")) {
    return NextResponse.redirect(new URL("/no-autorizado", nextUrl.origin));
  }

  return NextResponse.next();
});

// Only intercepts the protected routes (avoids running on assets and public routes).
export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*"],
};
