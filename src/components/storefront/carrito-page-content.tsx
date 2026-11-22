"use client";

import * as React from "react";
import { ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCartStore,
  selectTotalItems,
  selectTotalLempiras,
  type CartItem,
} from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatearLempiras, cn } from "@/lib/utils";
import { vaciarCarrito } from "@/server/carrito";
import { CartItemRow } from "./cart-item-row";

/** Stable no-op subscription for the hydration flag (it never notifies). */
function suscripcionVacia(): () => void {
  return () => {};
}

/**
 * CarritoPageContent — client content of the /carrito page.
 *
 * Reads items/totals from the store with useSyncExternalStore (neutral SSR
 * snapshot so that hydration does not break). Mobile-first layout with a
 * stationery character: header with a notebook line, paper badge with the count,
 * a list of CartItemRow (normal density) and a side summary that becomes sticky at lg+.
 *
 * "Vaciar carrito" uses an accessible inline confirmation (NOT window.confirm): an
 * intermediate step with managed focus and aria-live. The "Finalizar compra" CTA
 * points to /checkout (phase 2 stub that requires a session on the server).
 */
export function CarritoPageContent() {
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

  // Avoids an SSR→client flicker: until hydration we show a neutral placeholder
  // instead of the "empty cart" (which could be false if there are items in storage).
  // useSyncExternalStore with different server/client snapshots gives the
  // "mounted" flag without a setState in an effect (canonical hydration pattern).
  const montado = React.useSyncExternalStore(
    suscripcionVacia,
    () => true,
    () => false,
  );

  const vacio = items.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      {/* Header with a notebook line */}
      <header className="relative mb-8 pb-5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-step-3 font-bold text-ink">
              Tu carrito
            </h1>
            {montado && totalItems > 0 && (
              <Badge variant="neutral" className="translate-y-1">
                {totalItems} {totalItems === 1 ? "artículo" : "artículos"}
              </Badge>
            )}
          </div>
          <a
            href="/catalogo"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-1 text-step-0 font-medium text-primary transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            Seguir comprando
          </a>
        </div>
        {/* Notebook line: margin red + base */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-px bg-line"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-8 w-px bg-rose/40"
        />
      </header>

      {!montado ? (
        <PlaceholderCarrito />
      ) : vacio ? (
        <CarritoVacio />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          {/* Item list */}
          <section aria-label="Productos en el carrito">
            <ul className="flex flex-col gap-4">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartItemRow key={item.productId} item={item} />
                ))}
              </AnimatePresence>
            </ul>
            <BarraVaciar />
          </section>

          {/* Side summary, sticky at lg+ */}
          <aside aria-label="Resumen del pedido" className="lg:self-start">
            <div className="rounded-[var(--radius-lg)] border border-line bg-paper-2 p-6 shadow-card lg:sticky lg:top-24">
              <h2 className="font-display text-step-1 font-semibold text-ink">
                Resumen
              </h2>

              <dl className="mt-4 flex flex-col gap-2.5 text-step-0">
                <div className="flex items-baseline justify-between">
                  <dt className="text-ink-soft">
                    Subtotal{" "}
                    <span className="text-ink-faint">
                      ({totalItems} {totalItems === 1 ? "art." : "arts."})
                    </span>
                  </dt>
                  <dd className="font-semibold text-ink tabular-nums">
                    {formatearLempiras(totalLempiras)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between text-ink-faint">
                  <dt>Envío</dt>
                  <dd>Se calcula al pagar</dd>
                </div>
              </dl>

              <div className="my-4 border-t border-dashed border-line" />

              <div className="flex items-baseline justify-between">
                <span className="font-display text-step-1 font-semibold text-ink">
                  Total
                </span>
                <span className="font-display text-step-2 font-bold text-ink tabular-nums">
                  {formatearLempiras(totalLempiras)}
                </span>
              </div>
              <p className="mt-1 text-[0.8rem] text-ink-faint">
                Envío e impuestos se calculan al pagar.
              </p>

              <div className="mt-5 flex flex-col gap-2.5">
                {/* /checkout: phase 2 stub that requires a session on the SERVER. */}
                <Button
                  asChildLink
                  href="/checkout"
                  variant="accent"
                  size="lg"
                  className="w-full"
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
                  href="/catalogo"
                  variant="outline"
                  size="md"
                  className="w-full"
                >
                  Seguir comprando
                </Button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/**
 * BarraVaciar — "Vaciar carrito" action with an accessible inline confirmation.
 * No window.confirm: it shows a confirmation panel with aria-live and focus
 * placed on "Sí, vaciar" when it expands.
 */
function BarraVaciar() {
  const clear = useCartStore((s) => s.clear);
  const [confirmando, setConfirmando] = React.useState(false);
  const reducir = useReducedMotion();
  const confirmarRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (confirmando) confirmarRef.current?.focus();
  }, [confirmando]);

  return (
    <div className="mt-5">
      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-2 py-1.5 text-[0.85rem] font-medium text-ink-faint transition-colors hover:text-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Trash2 aria-hidden="true" className="size-4" strokeWidth={1.75} />
          Vaciar carrito
        </button>
      ) : (
        <motion.div
          initial={reducir ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="group"
          aria-label="Confirmar vaciar el carrito"
          className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-rose/30 bg-rose-50 px-4 py-3"
        >
          <p aria-live="polite" className="text-[0.85rem] font-medium text-ink">
            ¿Seguro que quieres vaciar todo el carrito?
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              ref={confirmarRef}
              type="button"
              onClick={() => {
                clear();
                // With an active session, empty the DB right away and
                // atomically (without depending on the debounced push window).
                if (useCartStore.getState().owner !== null) {
                  void vaciarCarrito();
                }
                setConfirmando(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] bg-rose px-3 py-1.5 text-[0.85rem] font-semibold text-paper transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-rose-50"
            >
              Sí, vaciar
            </button>
            <button
              type="button"
              onClick={() => setConfirmando(false)}
              className="rounded-[var(--radius-sm)] px-3 py-1.5 text-[0.85rem] font-medium text-ink-soft transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * Neutral placeholder while the store hydrates (avoids falsely showing
 * "empty"). Minimal visual hint, no flashy animation.
 */
function PlaceholderCarrito() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-8 lg:grid-cols-[1fr_22rem]"
    >
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="pn-shimmer h-28 rounded-[var(--radius-lg)] border border-line bg-paper-2"
          />
        ))}
      </div>
      <div className="pn-shimmer h-72 rounded-[var(--radius-lg)] border border-line bg-paper-2" />
    </div>
  );
}

/**
 * Empty state of the page: custom illustration + CTA to the catalog. Same
 * visual care as the rest of the storefront, not a generic screen.
 */
function CarritoVacio() {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-xl flex-col items-center gap-6 rounded-[var(--radius-xl)]",
        "border border-dashed border-line-strong bg-paper-2 px-6 py-16 text-center",
      )}
    >
      <IlustracionCarritoVacio className="h-40 w-auto" />
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-step-2 font-semibold text-ink">
          Tu carrito está vacío
        </h2>
        <p className="mx-auto max-w-md text-step-0 text-ink-soft">
          Todavía no agregas útiles. Date una vuelta por el catálogo: hay lápices,
          cuadernos y mochilas esperándote.
        </p>
      </div>
      <Button asChildLink href="/catalogo" variant="accent" size="lg">
        Explorar el catálogo
      </Button>
    </div>
  );
}

/**
 * Empty stationery cart with a couple of supplies inside (decorative).
 */
function IlustracionCarritoVacio({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 200"
      role="img"
      aria-label="Un carrito de compras vacío con útiles de papelería"
      className={className}
    >
      <ellipse cx="120" cy="186" rx="84" ry="11" className="fill-ink/5" />

      {/* Cart body */}
      <path
        d="M40 56 h18 l22 78 h78 l20 -54 H78"
        fill="none"
        className="stroke-ink-soft"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Paper-tinted basket */}
      <path
        d="M82 86 h94 l-14 38 a4 4 0 0 1-4 3 H92 a4 4 0 0 1-4-3 Z"
        className="fill-cat-cuadernos"
      />
      {/* Wheels */}
      <circle
        cx="92"
        cy="160"
        r="11"
        className="fill-paper stroke-ink-soft"
        strokeWidth="5"
      />
      <circle
        cx="156"
        cy="160"
        r="11"
        className="fill-paper stroke-ink-soft"
        strokeWidth="5"
      />

      {/* Pencil sticking out */}
      <g transform="rotate(-16 130 70)">
        <rect x="124" y="50" width="13" height="44" rx="2" className="fill-accent" />
        <polygon points="124,50 130,38 137,50" className="fill-amber" />
        <polygon points="127,44 130,38 133,44" className="fill-ink" />
        <rect x="124" y="94" width="13" height="7" rx="2" className="fill-rose" />
      </g>
      {/* Ruler sticking out */}
      <g transform="rotate(10 150 72)">
        <rect
          x="150"
          y="46"
          width="11"
          height="50"
          rx="2"
          className="fill-primary-50 stroke-primary/40"
          strokeWidth="2"
        />
        <line x1="150" y1="56" x2="155" y2="56" className="stroke-primary/50" strokeWidth="2" />
        <line x1="150" y1="66" x2="155" y2="66" className="stroke-primary/50" strokeWidth="2" />
        <line x1="150" y1="76" x2="155" y2="76" className="stroke-primary/50" strokeWidth="2" />
      </g>
    </svg>
  );
}
