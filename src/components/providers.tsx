"use client";

// Client providers of the app. Wraps NextAuth's SessionProvider
// so that `useSession()` works in client components.
//
// ⚠️ NOT MOUNTED YET (decision recorded in the README): no client
// component uses useSession() yet, and mounting it needlessly adds a fetch
// to /api/auth/session on every load. When the first client component
// needs it, integrate it from src/app/layout.tsx PASSING the server's session
// to avoid that extra fetch:
//   import { auth } from "@/lib/auth";
//   import { Providers } from "@/components/providers";
//   const session = await auth();
//   <body>...<Providers session={session}>{children}</Providers>...</body>
//
// NOTE: this is NOT used in SERVER components; there the session is read with
//   const session = await auth();
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
