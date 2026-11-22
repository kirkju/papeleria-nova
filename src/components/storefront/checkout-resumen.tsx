"use client";

import * as React from "react";
import Image from "next/image";
import { Pencil, ShoppingBag } from "lucide-react";
import {
  useCartStore,
  selectTotalItems,
  selectTotalLempiras,
  type CartItem,
} from "@/stores/cart";
import { calcularEnvio } from "@/lib/pedidos/calculos";
import { Button } from "@/components/ui/button";
import { formatearLempiras, cn } from "@/lib/utils";

/**
 * ResumenCheckout — order summary panel in the checkout.
 *
 * Reads the cart from the store with useSyncExternalStore (same pattern as
 * carrito-page-content: neutral SSR snapshots + the `montado` flag so that it
 * does not flicker to "empty" before hydrating). Shipping is calculated with
 * `calcularEnvio` from @/lib/pedidos/calculos (the business rule is NOT
 * duplicated here). The final total is ALWAYS recalculated by the server from
 * the DB; this summary is only indicative.
 *
 * It emits no form fields. The items that travel to the server are taken by the
 * assembling page from the store (itemsJson) on submit; this component only
 * displays. It looks fine both with items and in the empty state.
 *
 * Usage:
 *   <ResumenCheckout />
 */

/** Threshold (in Lempiras) under which we show "Te faltan L X para envío gratis". */
const CERCA_ENVIO_GRATIS = 300;

/** Stable no-op subscription for the hydration flag (it never notifies). */
function suscripcionVacia(): () => void {
  return () => {};
}

export function ResumenCheckout() {
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
  const subtotal = React.useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalLempiras(useCartStore.getState()),
    () => 0,
  );
  const montado = React.useSyncExternalStore(
    suscripcionVacia,
    () => true,
    () => false,
  );

  if (!montado) return <ResumenPlaceholder />;

  if (items.length === 0) return <ResumenVacio />;

  const envio = calcularEnvio(subtotal);
  const envioGratis = envio === 0;
  const total = subtotal + envio;

  return (
    <section
      aria-label="Resumen del pedido"
      className="rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-step-1 font-semibold text-ink">
          Tu pedido
        </h2>
        <a
          href="/carrito"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-1 text-[0.85rem] font-medium text-primary transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil aria-hidden="true" className="size-3.5" strokeWidth={2} />
          Editar carrito
        </a>
      </div>

      {/* Compact item list */}
      <ul className="mt-4 flex flex-col divide-y divide-line/70">
        {items.map((item) => (
          <li key={item.productId} className="flex items-center gap-3 py-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-paper-3">
              <Image
                src={item.imagen ?? "/productos/placeholder.svg"}
                alt={item.nombre}
                fill
                sizes="48px"
                className="object-cover"
              />
              {/* Bubble with the quantity, inventory-tag style. */}
              <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.68rem] font-bold text-on-primary tabular-nums">
                {item.cantidad}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9rem] font-medium text-ink">
                {item.nombre}
              </p>
              <p className="text-[0.8rem] text-ink-faint tabular-nums">
                {item.cantidad} × {formatearLempiras(item.precio)}
              </p>
            </div>
            <p className="shrink-0 text-[0.9rem] font-semibold text-ink tabular-nums">
              {formatearLempiras(item.precio * item.cantidad)}
            </p>
          </li>
        ))}
      </ul>

      <div className="my-4 border-t border-dashed border-line" />

      {/* Totals */}
      <dl className="flex flex-col gap-2.5 text-step-0">
        <div className="flex items-baseline justify-between">
          <dt className="text-ink-soft">
            Subtotal{" "}
            <span className="text-ink-faint">
              ({totalItems} {totalItems === 1 ? "art." : "arts."})
            </span>
          </dt>
          <dd className="font-semibold text-ink tabular-nums">
            {formatearLempiras(subtotal)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-ink-soft">Envío</dt>
          <dd
            className={cn(
              "font-semibold tabular-nums",
              envioGratis ? "text-mint" : "text-ink",
            )}
          >
            {envioGratis ? "Gratis" : formatearLempiras(envio)}
          </dd>
        </div>
      </dl>

      {/* Close-to-free-shipping message */}
      <MensajeEnvioGratis subtotal={subtotal} envioGratis={envioGratis} />

      <div className="my-4 border-t border-dashed border-line" />

      <div className="flex items-baseline justify-between">
        <span className="font-display text-step-1 font-semibold text-ink">
          Total
        </span>
        <span className="font-display text-step-2 font-bold text-ink tabular-nums">
          {formatearLempiras(total)}
        </span>
      </div>
      <p className="mt-1.5 text-[0.8rem] text-ink-faint">
        El total final se confirma al procesar el pedido.
      </p>
    </section>
  );
}

/**
 * MensajeEnvioGratis — "Te faltan L X para envío gratis" when the subtotal
 * is less than CERCA_ENVIO_GRATIS away from the threshold. It derives the
 * threshold by querying calcularEnvio (without duplicating the constant): it
 * looks for the smallest added amount that makes shipping free, without going
 * over CERCA_ENVIO_GRATIS.
 */
function MensajeEnvioGratis({
  subtotal,
  envioGratis,
}: {
  subtotal: number;
  envioGratis: boolean;
}) {
  if (envioGratis) return null;

  // If adding CERCA_ENVIO_GRATIS already gives free shipping, we are "close".
  const conTope = calcularEnvio(subtotal + CERCA_ENVIO_GRATIS);
  if (conTope !== 0) return null;

  // Fine search for the exact missing amount (steps of L 1) so as not to hardcode the threshold.
  let restante = CERCA_ENVIO_GRATIS;
  for (let extra = 1; extra <= CERCA_ENVIO_GRATIS; extra += 1) {
    if (calcularEnvio(subtotal + extra) === 0) {
      restante = extra;
      break;
    }
  }

  return (
    <p className="mt-3 rounded-[var(--radius-md)] bg-mint-50 px-3.5 py-2.5 text-[0.85rem] font-medium text-mint">
      Te faltan {formatearLempiras(restante)} para que el envío sea gratis.
    </p>
  );
}

/** Placeholder while the store hydrates (avoids a false "empty"). */
function ResumenPlaceholder() {
  return (
    <div
      aria-hidden="true"
      className="pn-shimmer h-80 rounded-[var(--radius-lg)] border border-line bg-paper-2"
    />
  );
}

/** Empty state of the summary: in case the checkout is reached with no items. */
function ResumenVacio() {
  return (
    <section
      aria-label="Resumen del pedido"
      className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-paper-2 px-5 py-10 text-center"
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-paper-3 text-ink-faint"
      >
        <ShoppingBag className="size-7" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-step-1 font-semibold text-ink">
          Tu carrito está vacío
        </h2>
        <p className="text-[0.9rem] text-ink-soft">
          Agrega útiles para continuar con tu compra.
        </p>
      </div>
      <Button asChildLink href="/catalogo" variant="accent" size="md">
        Ir al catálogo
      </Button>
    </section>
  );
}
