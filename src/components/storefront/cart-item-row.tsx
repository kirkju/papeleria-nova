"use client";

import * as React from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCartStore, type CartItem } from "@/stores/cart";
import { formatearLempiras, cn } from "@/lib/utils";

/**
 * CartItemRow — row of a product inside the cart (drawer or page).
 *
 * Two densities:
 * - `compacto` (drawer): 64px image, tight single-column layout.
 * - normal (/carrito page): 80px image, more breathing room and an aligned subtotal.
 *
 * Accessible stepper: −/+ buttons with aria-label, value with aria-live="polite"
 * to announce changes, and the "+" is disabled on reaching the stock with
 * title="Stock máximo". Uses the store's `setCantidad` (clamps 1..stock).
 * Remove button with a descriptive aria-label, no confirmation (the cart is
 * easily reversible by adding the item again). Subtle exit animation
 * delegated to the parent's AnimatePresence (this component is a
 * `motion.li` that exposes its `exit`), respecting prefers-reduced-motion.
 *
 * Integration NOTE: the store's `CartItem` does NOT include `slug`, so the
 * name is shown as plain text (not linked to the product detail).
 * FUTURE IMPROVEMENT: add `slug?: string` to the `CartItem` type in @/stores/cart
 * to link the name to /producto/<slug> (out of scope for this phase;
 * cart.ts cannot be touched here).
 *
 * Usage:
 *   <CartItemRow item={item} />              // page
 *   <CartItemRow item={item} compacto />     // drawer
 */
export function CartItemRow({
  item,
  compacto = false,
}: {
  item: CartItem;
  compacto?: boolean;
}) {
  const reducir = useReducedMotion();
  const setCantidad = useCartStore((s) => s.setCantidad);
  const removeItem = useCartStore((s) => s.removeItem);

  const tope = Math.max(1, item.stock);
  const enTope = item.cantidad >= tope;
  const subtotalLinea = item.precio * item.cantidad;

  return (
    <motion.li
      layout={!reducir}
      initial={reducir ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={
        reducir
          ? { opacity: 0 }
          : { opacity: 0, x: 24, transition: { duration: 0.2 } }
      }
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "flex gap-3",
        compacto
          ? "py-4"
          : "rounded-[var(--radius-lg)] border border-line bg-paper-2 p-4 shadow-card sm:gap-4 sm:p-5",
      )}
    >
      {/* Image with a paper background and radius md */}
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-paper-3",
          compacto ? "size-16" : "size-20 sm:size-24",
        )}
      >
        <Image
          src={item.imagen ?? "/productos/placeholder.svg"}
          alt={item.nombre}
          fill
          sizes={compacto ? "64px" : "96px"}
          className="object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {/* Name as plain text: the CartItem carries no slug (see the note). */}
            <p
              className={cn(
                "font-display font-semibold leading-snug text-ink",
                compacto ? "text-step-0 line-clamp-2" : "text-step-1",
              )}
            >
              {item.nombre}
            </p>
            <p className="mt-0.5 text-[0.72rem] uppercase tracking-wide text-ink-faint">
              SKU {item.sku}
            </p>
          </div>

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeItem(item.productId)}
            aria-label={`Quitar ${item.nombre} del carrito`}
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
              "text-ink-faint transition-colors hover:bg-rose-50 hover:text-rose",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <Trash2 aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
          {/* Quantity stepper */}
          <div
            role="group"
            aria-label={`Cantidad de ${item.nombre}`}
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-line-strong bg-paper"
          >
            <button
              type="button"
              onClick={() => setCantidad(item.productId, item.cantidad - 1)}
              disabled={item.cantidad <= 1}
              aria-label={`Disminuir cantidad de ${item.nombre}`}
              className="inline-flex size-10 items-center justify-center rounded-l-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
            </button>
            {/* Plain text on purpose: a live region here would announce all
                the quantities when the list mounts. The context comes from the group
                and the aria-labels of the stepper buttons. */}
            <span className="min-w-9 px-1 text-center text-step-0 font-semibold text-ink tabular-nums">
              {item.cantidad}
            </span>
            <button
              type="button"
              onClick={() => setCantidad(item.productId, item.cantidad + 1)}
              disabled={enTope}
              aria-label={`Aumentar cantidad de ${item.nombre}`}
              title={enTope ? "Stock máximo" : undefined}
              className="inline-flex size-10 items-center justify-center rounded-r-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
            </button>
          </div>

          {/* Prices: unit + line subtotal */}
          <div className="text-right">
            <p className="text-[0.8rem] text-ink-faint">
              {formatearLempiras(item.precio)} c/u
            </p>
            <p
              className={cn(
                "font-display font-bold text-ink",
                compacto ? "text-step-0" : "text-step-1",
              )}
            >
              <span className="sr-only">Subtotal: </span>
              {formatearLempiras(subtotalLinea)}
            </p>
          </div>
        </div>

        {enTope && (
          <p className="text-[0.78rem] font-medium text-amber">
            Llegaste al máximo disponible ({tope}).
          </p>
        )}
      </div>
    </motion.li>
  );
}
