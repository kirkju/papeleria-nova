import Link from "next/link";
import { Search, UserRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { CartButton } from "./cart-button";
import { LogoutButton } from "./logout-button";
import { MobileMenu } from "./mobile-menu";
import { CartDrawer } from "@/components/storefront/cart-drawer";

/**
 * Header — header of the Papelería Nova storefront.
 *
 * Server Component. Only the cart button and the mobile menu are client
 * components (isolated) to avoid over-hydrating. It includes a typographic
 * wordmark with personality, a GET search box to /catalogo, navigation and the
 * account area.
 */
const ENLACES = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export async function Header() {
  const session = await auth();
  const primerNombre = session?.user?.name?.split(" ")[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:h-18 lg:px-8">
        {/* Wordmark: display font + color detail (tangerine dot over the "i") */}
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          aria-label="Papelería Nova, inicio"
        >
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary text-on-primary font-display text-step-1 font-bold leading-none transition-transform duration-200 group-hover:-rotate-6"
          >
            Pn
          </span>
          <span className="font-display text-step-1 font-semibold tracking-tight">
            Papeler
            <span className="relative">
              í
              <span
                aria-hidden="true"
                className="absolute -top-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-accent"
              />
            </span>
            a{" "}
            <span className="text-accent">Nova</span>
          </span>
        </Link>

        {/* Search box (GET → /catalogo). Hidden on mobile; it goes in the menu. */}
        <form
          action="/catalogo"
          method="get"
          role="search"
          className="relative ml-4 hidden flex-1 items-center md:flex"
        >
          <label htmlFor="q-header" className="sr-only">
            Buscar productos
          </label>
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute left-1.5 z-10 inline-flex size-8 items-center justify-center rounded-[var(--radius-pill)] text-ink-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Search aria-hidden="true" className="size-5" />
          </button>
          <input
            id="q-header"
            name="q"
            type="search"
            placeholder="Buscar lápices, cuadernos, mochilas…"
            className="h-11 w-full max-w-md rounded-[var(--radius-pill)] border border-line bg-paper-2 pl-10 pr-4 text-step-0 text-ink placeholder:text-ink-faint transition-[border-color] duration-200 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </form>

        {/* Desktop navigation */}
        <nav
          aria-label="Principal"
          className="ml-auto hidden items-center gap-1 md:flex"
        >
          {ENLACES.map((e) => (
            <Link
              key={e.href}
              href={e.href}
              className="rounded-[var(--radius-md)] px-3 py-2 text-step-0 font-medium text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {e.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          {session?.user ? (
            <>
              <Link
                href="/cuenta"
                aria-label={`Mi cuenta: ${session.user.name ?? "perfil"}`}
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] px-2.5 text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              >
                <UserRound aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
                <span className="hidden max-w-28 truncate text-step-0 font-medium lg:inline">
                  {primerNombre ?? "Mi cuenta"}
                </span>
              </Link>
              {/* Signs out after flushing the cart to the DB first (see
                  LogoutButton): avoids losing the last change if a
                  debounced push was still in flight. */}
              <LogoutButton />
            </>
          ) : (
            <Link
              href="/login"
              aria-label="Entrar a mi cuenta"
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <UserRound aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
            </Link>
          )}

          <CartButton />

          <MobileMenu enlaces={ENLACES} />
        </div>
      </div>

      {/* Cart side panel (client island; state in useUiStore). */}
      <CartDrawer />
    </header>
  );
}
