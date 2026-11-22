"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Search } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EnlaceNav {
  href: string;
  label: string;
}

/**
 * MobileMenu — trigger + collapsible navigation panel for mobile.
 *
 * Accessible: button with aria-expanded/aria-controls, panel with role="dialog",
 * closes on Escape and on navigation, background scroll lock, focus returned to
 * the trigger. Isolated as a client component so the whole Header does not become one.
 */
export function MobileMenu({ enlaces }: { enlaces: EnlaceNav[] }) {
  const [abierto, setAbierto] = React.useState(false);
  const disparadorRef = React.useRef<HTMLButtonElement>(null);
  const reducir = useReducedMotion();

  React.useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [abierto]);

  const cerrar = () => {
    setAbierto(false);
    disparadorRef.current?.focus();
  };

  return (
    <div className="md:hidden">
      <button
        ref={disparadorRef}
        type="button"
        onClick={() => setAbierto(true)}
        aria-expanded={abierto}
        aria-controls="menu-movil"
        aria-label="Abrir menú de navegación"
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-ink",
          "transition-colors hover:bg-paper-3 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        )}
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.75} />
      </button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={cerrar}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            />
            <motion.div
              id="menu-movil"
              role="dialog"
              aria-modal="true"
              aria-label="Navegación principal"
              initial={reducir ? { opacity: 0 } : { x: "100%" }}
              animate={reducir ? { opacity: 1 } : { x: 0 }}
              exit={reducir ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-0 top-0 flex h-full w-[82%] max-w-sm flex-col bg-paper shadow-lift"
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <span className="font-display text-step-1 font-semibold">
                  Menú
                </span>
                <button
                  type="button"
                  onClick={cerrar}
                  aria-label="Cerrar menú"
                  className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-ink hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>

              <form
                action="/catalogo"
                method="get"
                role="search"
                className="border-b border-line p-5"
              >
                <label htmlFor="q-movil" className="sr-only">
                  Buscar productos
                </label>
                <div className="relative flex items-center">
                  <button
                    type="submit"
                    aria-label="Buscar"
                    className="absolute left-1.5 z-10 inline-flex size-8 items-center justify-center rounded-[var(--radius-md)] text-ink-faint transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Search aria-hidden="true" className="size-5" />
                  </button>
                  <input
                    id="q-movil"
                    name="q"
                    type="search"
                    placeholder="Buscar útiles…"
                    className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 pl-10 pr-3.5 text-step-0 text-ink placeholder:text-ink-faint focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                  />
                </div>
              </form>

              <nav aria-label="Principal" className="flex flex-col p-3">
                {enlaces.map((e) => (
                  <Link
                    key={e.href}
                    href={e.href}
                    onClick={() => setAbierto(false)}
                    className="rounded-[var(--radius-md)] px-4 py-3 text-step-1 font-medium text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {e.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
