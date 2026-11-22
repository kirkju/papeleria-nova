"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { X, ShoppingBag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useUiStore } from "@/stores/ui";
import {
  useCartStore,
  selectTotalItems,
  selectTotalLempiras,
  type CartItem,
} from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { formatearLempiras } from "@/lib/utils";
import { CartItemRow } from "./cart-item-row";

/**
 * CartDrawer — right-hand side panel of the cart.
 *
 * Clickable darkened overlay + a `max-w-md` panel that slides in
 * (200–260ms easeOut; no animation with prefers-reduced-motion). Accessible as a
 * modal dialog: role="dialog", aria-modal, aria-label, closing with Escape /
 * overlay / X button, basic focus trap (Tab cycles inside the panel) and focus
 * returned to the element that opened it. Background scroll stays locked
 * while it is open (pattern taken from layout/mobile-menu).
 *
 * Reads items/totals from the cart store via useSyncExternalStore with a
 * neutral server snapshot so that hydration does not break. The open
 * state lives in useUiStore.
 *
 * It is mounted only once, at the end of the Header. It is a client island.
 */
export function CartDrawer() {
  const reducir = useReducedMotion();
  const abierto = useUiStore((s) => s.carritoAbierto);
  const cerrarCarrito = useUiStore((s) => s.cerrarCarrito);

  // A server snapshot of 0/[] avoids the hydration mismatch (the store
  // persisted in localStorage does not exist yet in SSR).
  const items = React.useSyncExternalStore<CartItem[]>(
    useCartStore.subscribe,
    () => useCartStore.getState().items,
    () => [],
  );
  const totalItems = React.useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalItems(useCartStore.getState()),
    () => 0,
  );
  const totalLempiras = React.useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalLempiras(useCartStore.getState()),
    () => 0,
  );

  const panelRef = React.useRef<HTMLDivElement>(null);
  const tituloId = React.useId();
  const vacio = items.length === 0;

  // Closes the drawer on ANY route change (browser back/forward,
  // links outside the drawer). Without this, the panel persists over the new page
  // with the body scroll locked, because Header/CartDrawer survive
  // navigation inside the layout.
  const pathname = usePathname();
  React.useEffect(() => {
    cerrarCarrito();
  }, [pathname, cerrarCarrito]);

  // Escape to close + background scroll lock + focus returned to the
  // trigger (the active element is saved on open).
  React.useEffect(() => {
    if (!abierto) return;
    const disparador = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarCarrito();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Returns focus to the trigger; if it is no longer in the document, it falls back to
      // the header's cart button (persistent) so that focus is not dropped onto the body.
      if (disparador && document.contains(disparador)) {
        disparador.focus();
      } else {
        document
          .querySelector<HTMLElement>('button[aria-haspopup="dialog"]')
          ?.focus();
      }
    };
  }, [abierto, cerrarCarrito]);

  // Initial focus on the panel + basic focus trap (Tab cycles inside the panel).
  React.useEffect(() => {
    if (!abierto) return;
    const panel = panelRef.current;
    if (!panel) return;

    panel.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      const activo = document.activeElement;

      if (e.shiftKey && activo === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      } else if (!panel.contains(activo)) {
        // Focus escaped the panel (e.g. it ended up on the body after a
        // re-render): we bring it back so the trap does not let Tab through to the background.
        e.preventDefault();
        primero.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [abierto, vacio]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Clickable overlay. It is a presentational div (outside the tab
              order) on purpose: closing by keyboard is covered by Escape and the
              X button, and this way the accessible name "Cerrar carrito" is not duplicated. */}
          <div
            role="presentation"
            onClick={cerrarCarrito}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            initial={reducir ? { opacity: 0 } : { x: "100%" }}
            animate={reducir ? { opacity: 1 } : { x: 0 }}
            exit={reducir ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-lift focus:outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2
                id={tituloId}
                className="flex items-baseline gap-2 font-display text-step-1 font-semibold text-ink"
              >
                Tu carrito
                <span className="text-step-0 font-medium text-ink-faint tabular-nums">
                  ({totalItems})
                </span>
              </h2>
              <button
                type="button"
                onClick={cerrarCarrito}
                aria-label="Cerrar carrito"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            {vacio ? (
              <CarritoVacio onNavegar={cerrarCarrito} />
            ) : (
              <>
                {/* Scrollable list */}
                <div className="flex-1 overflow-y-auto px-5">
                  <ul className="divide-y divide-line">
                    <AnimatePresence initial={false}>
                      {items.map((item) => (
                        <CartItemRow
                          key={item.productId}
                          item={item}
                          compacto
                        />
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>

                {/* Sticky footer */}
                <div className="border-t border-line bg-paper-2 px-5 py-5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-step-0 font-medium text-ink-soft">
                      Subtotal
                    </span>
                    <span className="font-display text-step-2 font-bold text-ink tabular-nums">
                      {formatearLempiras(totalLempiras)}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.8rem] text-ink-faint">
                    Envío e impuestos se calculan al pagar.
                  </p>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {/* Main tangerine CTA → /checkout (phase 2 stub that
                        requires a session on the server). */}
                    <Button
                      asChildLink
                      href="/checkout"
                      variant="accent"
                      size="lg"
                      className="w-full"
                      onClick={cerrarCarrito}
                    >
                      <ShoppingBag
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={2}
                      />
                      Finalizar compra
                    </Button>
                    <Button
                      asChildLink
                      href="/carrito"
                      variant="outline"
                      size="md"
                      className="w-full"
                      onClick={cerrarCarrito}
                    >
                      Ver carrito
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Empty state of the drawer: stationery bag illustration + CTA to the catalog.
 * Closes the drawer on navigation (onNavegar).
 */
function CarritoVacio({ onNavegar }: { onNavegar: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
      <IlustracionBolsaVacia className="h-32 w-auto" />
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-step-1 font-semibold text-ink">
          Tu carrito está vacío
        </p>
        <p className="mx-auto max-w-xs text-step-0 text-ink-soft">
          Aún no agregas útiles. Explora el catálogo y encuentra algo lindo.
        </p>
      </div>
      <Button
        asChildLink
        href="/catalogo"
        variant="primary"
        size="md"
        onClick={onNavegar}
      >
        Explorar el catálogo
      </Button>
    </div>
  );
}

/**
 * Stationery paper bag with a pencil sticking out: custom illustration for
 * the empty cart (decorative, aria-hidden). Uses brand color tokens.
 */
function IlustracionBolsaVacia({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Una bolsa de papel vacía con un lápiz"
      className={className}
    >
      {/* Shadow (soft) */}
      <ellipse cx="100" cy="178" rx="62" ry="10" className="fill-ink/5" />

      {/* Bag body */}
      <path
        d="M52 70 h96 l-6 96 a8 8 0 0 1-8 7.4 H66 a8 8 0 0 1-8-7.4 Z"
        className="fill-paper-3 stroke-line-strong"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Top fold */}
      <path
        d="M52 70 q48 14 96 0"
        fill="none"
        className="stroke-line-strong"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Handles */}
      <path
        d="M76 70 q4 -26 24 -26 t24 26"
        fill="none"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Pencil sticking out, slightly tilted */}
      <g transform="rotate(14 128 60)">
        <rect
          x="120"
          y="22"
          width="16"
          height="64"
          rx="3"
          className="fill-accent"
        />
        <rect x="120" y="40" width="16" height="5" className="fill-paper" />
        <polygon points="120,22 128,6 136,22" className="fill-amber" />
        <polygon points="125,14 128,6 131,14" className="fill-ink" />
        <rect x="120" y="86" width="16" height="9" rx="3" className="fill-rose" />
      </g>
    </svg>
  );
}
