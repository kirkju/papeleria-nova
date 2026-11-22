import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSync } from "@/components/storefront/cart-sync";
import { CuentaSubnav } from "@/components/storefront/cuenta-subnav";

/**
 * Layout of the ACCOUNT AREA (`(cuenta)` route group).
 *
 * This group does NOT inherit from the `(public)` group, so it mounts the
 * storefront chrome itself to keep the visual continuity (paper/ink): skip-link,
 * CartSync (UI-less island, with the session userId), Header and Footer — same
 * pattern as `(public)/layout.tsx`.
 *
 * Hard defense: besides the proxy (which already requires a session on /cuenta/**),
 * the session is revalidated here with `auth()`, redirecting to /login with a
 * callbackUrl if there is none.
 *
 * On top of the inner chrome a "Mi cuenta" header is drawn, with a greeting by
 * first name and an accessible sub-navigation (tabs on mobile, sidebar at md+)
 * with the active tab marked via `aria-current` (the `CuentaSubnav` island).
 *
 * metadata: title template "%s · Mi cuenta" and robots noindex (the area is
 * private; `robots.ts` also blocks it at site level).
 */
export const metadata: Metadata = {
  title: {
    default: "Mi cuenta",
    template: "%s · Mi cuenta",
  },
  robots: { index: false, follow: false },
};

export default async function CuentaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  // Defense in depth: if for any reason the request arrives without a session, we do
  // not serve the account area. The proxy is the first barrier; this is the safety net.
  if (!session?.user) {
    redirect("/login?callbackUrl=/cuenta");
  }

  const primerNombre = session.user.name?.split(" ")[0]?.trim();

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-[var(--radius-md)] bg-primary px-4 py-2 font-medium text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-paper"
      >
        Saltar al contenido
      </a>
      <CartSync userId={session.user.id ?? null} />
      <Header />

      <main id="contenido" className="relative z-[1] flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {/* Area header */}
          <header className="flex flex-col gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-1.5 w-12 rounded-full bg-accent/70"
            />
            <h1 className="font-display text-step-3 font-semibold leading-[1.05] tracking-[-0.02em] text-ink">
              Mi cuenta
            </h1>
            {primerNombre && (
              <p className="text-step-0 text-ink-soft">
                Hola de nuevo,{" "}
                <span className="font-medium text-ink">{primerNombre}</span>.
                Aquí gestionas tus datos, pedidos y direcciones.
              </p>
            )}
          </header>

          {/* Body: sidebar (md+) + content. On mobile, tabs above the content. */}
          <div className="mt-8 grid gap-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="md:sticky md:top-24 md:self-start">
              <CuentaSubnav />
            </aside>
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
