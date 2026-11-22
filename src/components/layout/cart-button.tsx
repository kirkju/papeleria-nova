"use client";

import * as React from "react";
import { ShoppingBag } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCartStore, selectTotalItems } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { cn } from "@/lib/utils";

/**
 * CartButton — CartDrawer trigger with a reactive counter badge.
 *
 * It used to navigate to /carrito; now it opens the side panel (useUiStore). It
 * exposes aria-haspopup="dialog" and aria-expanded according to the drawer
 * state. The badge does a subtle "bump" when the count changes.
 *
 * Isolated as a client component so as not to force "use client" on the whole
 * Header. The count uses useSyncExternalStore with a server snapshot of 0 to
 * avoid a hydration mismatch (the persisted store does not exist yet in SSR).
 */
export function CartButton({ className }: { className?: string }) {
  const reducir = useReducedMotion();
  const abrirCarrito = useUiStore((s) => s.abrirCarrito);
  const abierto = useUiStore((s) => s.carritoAbierto);

  const conteo = React.useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalItems(useCartStore.getState()),
    () => 0,
  );

  const etiqueta =
    conteo > 0
      ? `Carrito de compras, ${conteo} ${conteo === 1 ? "artículo" : "artículos"}`
      : "Carrito de compras, vacío";

  return (
    <button
      type="button"
      onClick={abrirCarrito}
      aria-label={etiqueta}
      aria-haspopup="dialog"
      aria-expanded={abierto}
      className={cn(
        "relative inline-flex size-11 items-center justify-center rounded-[var(--radius-md)]",
        "text-ink transition-colors duration-200 hover:bg-paper-3",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        className,
      )}
    >
      <ShoppingBag aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
      <AnimatePresence>
        {conteo > 0 && (
          <motion.span
            key={conteo}
            aria-hidden="true"
            initial={reducir ? false : { scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reducir ? undefined : { scale: 0.4, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={cn(
              "absolute -right-1 -top-1 flex min-w-5 items-center justify-center",
              "rounded-[var(--radius-pill)] bg-accent px-1 text-[0.7rem] font-bold leading-5 text-on-accent",
              "shadow-card",
            )}
          >
            {conteo > 99 ? "99+" : conteo}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
