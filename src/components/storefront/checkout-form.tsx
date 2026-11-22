"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ShoppingBag } from "lucide-react";
import {
  useCartStore,
  selectTotalItems,
  type CartItem,
} from "@/stores/cart";
import { crearPedido } from "@/server/pedidos";
import { Button } from "@/components/ui/button";
import { SeccionDireccion } from "@/components/storefront/checkout-direccion";
import { SeccionPago } from "@/components/storefront/checkout-pago";
import { ResumenCheckout } from "@/components/storefront/checkout-resumen";

/**
 * CheckoutForm — client form that assembles the whole checkout.
 *
 * It composes, inside a single <form>:
 *  - SeccionDireccion (name + saved/new address)
 *  - SeccionPago (payment method; DEMO card without name)
 *  - ResumenCheckout (indicative panel read from the store)
 * in a 2-column layout at lg (sections on the left, sticky summary on the
 * right); on mobile it stacks with the summary at the end.
 *
 * Key mechanics (golden rule: the client ONLY sends productId + cantidad):
 *  - The hidden `itemsJson` is filled IN the onSubmit, reading the current state
 *    of the store with getState() — that way the truth of the local cart ALWAYS
 *    travels, without depending on re-renders. The server recalculates prices/subtotal/total.
 *  - useActionState wraps crearPedido; on success we empty the store with clear()
 *    (the Cart in the DB was already emptied inside the transaction; CartSync's
 *    push of [] is idempotent) and navigate to the confirmation with the number.
 *  - On error we show a role="alert" banner at the top and scroll to it; the
 *    local cart is NOT touched so that the user can fix it (e.g. remove an
 *    out-of-stock product) and retry.
 *
 * Empty cart => instead of the form, an empty state with a CTA to the catalog
 * (using the `montado` flag so that it does not flicker in SSR).
 */
export interface CheckoutFormProps {
  direcciones: {
    id: string;
    linea1: string;
    linea2: string | null;
    ciudad: string;
    departamento: string;
    telefono: string;
    esPredeterminada: boolean;
  }[];
  nombreInicial?: string;
}

/** State of the local action: the error message to show (or null if all is ok). */
interface EstadoCheckout {
  error: string | null;
}

const ESTADO_INICIAL: EstadoCheckout = { error: null };

/** Stable no-op subscription for the hydration flag (it never notifies). */
function suscripcionVacia(): () => void {
  return () => {};
}

export function CheckoutForm({ direcciones, nombreInicial }: CheckoutFormProps) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // Item count (to decide whether there is a cart) + hydration flag,
  // same pattern as ResumenCheckout so as not to break SSR or flicker.
  const totalItems = React.useSyncExternalStore(
    useCartStore.subscribe,
    () => selectTotalItems(useCartStore.getState()),
    () => 0,
  );
  const montado = React.useSyncExternalStore(
    suscripcionVacia,
    () => true,
    () => false,
  );

  /**
   * crearPedido wrapper for useActionState. On success it empties the local store
   * and redirects to the confirmation; the state it returns only carries the error
   * (on success we navigate and the render no longer matters). The FormData already
   * carries `itemsJson` filled in by the form's onSubmit.
   */
  const accionCheckout = React.useCallback(
    async (
      _previo: EstadoCheckout,
      formData: FormData,
    ): Promise<EstadoCheckout> => {
      const resultado = await crearPedido(formData);

      if (resultado.ok) {
        // The Cart in the DB was already emptied inside the transaction; here it is enough
        // to clear the local store (CartSync's push of [] is idempotent).
        useCartStore.getState().clear();
        router.push(`/checkout/confirmacion/${resultado.numero}`);
        return { error: null };
      }

      return { error: resultado.error };
    },
    [router],
  );

  const [estado, accion, enviando] = React.useActionState(
    accionCheckout,
    ESTADO_INICIAL,
  );

  // When an error appears, we move focus/scroll to the banner so that it is noticed.
  React.useEffect(() => {
    if (estado.error) {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus();
    }
  }, [estado.error]);

  /**
   * Fills the hidden `itemsJson` with the CURRENT state of the store right before
   * the action reads the FormData. We read with getState() (not from the render) to
   * guarantee the truth of the cart at submit time.
   */
  function alEnviar() {
    const form = formRef.current;
    if (!form) return;
    const campo = form.elements.namedItem("itemsJson");
    if (campo instanceof HTMLInputElement) {
      const items: CartItem[] = useCartStore.getState().items;
      campo.value = JSON.stringify(
        items.map(({ productId, cantidad }) => ({ productId, cantidad })),
      );
    }
  }

  // Before hydration: neutral placeholder (we do not know yet whether there is a cart).
  if (!montado) return <CheckoutSkeleton />;

  // Empty cart: showing the form makes no sense.
  if (totalItems === 0) return <CheckoutVacio />;

  return (
    <form
      ref={formRef}
      action={accion}
      onSubmit={alEnviar}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
    >
      {/* itemsJson: filled by alEnviar() from the store. It starts empty. */}
      <input type="hidden" name="itemsJson" defaultValue="" />

      {/* Left column: form sections */}
      <div className="flex flex-col gap-8">
        {/* Server error banner (stock, address, etc.). */}
        {estado.error && (
          <div
            ref={bannerRef}
            role="alert"
            tabIndex={-1}
            className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-rose/40 bg-rose-50 px-4 py-3.5 text-step-0 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-rose"
              strokeWidth={2}
            />
            <div>
              <p className="font-semibold text-rose">
                No pudimos completar tu pedido
              </p>
              <p className="mt-0.5 text-ink-soft">{estado.error}</p>
            </div>
          </div>
        )}

        <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-5 shadow-card sm:p-6">
          <SeccionDireccion
            direcciones={direcciones}
            nombreInicial={nombreInicial}
          />
        </section>

        <section className="rounded-[var(--radius-lg)] border border-line bg-paper p-5 shadow-card sm:p-6">
          <SeccionPago />
        </section>
      </div>

      {/* Right column: summary, sticky at lg, at the end on mobile. */}
      <aside className="lg:sticky lg:top-24">
        <ResumenCheckout />

        <div className="mt-5">
          <Button
            type="submit"
            variant="accent"
            size="lg"
            loading={enviando}
            disabled={enviando}
            className="w-full"
          >
            <ShoppingBag aria-hidden="true" className="size-5" strokeWidth={2} />
            {enviando ? "Procesando…" : "Confirmar pedido"}
          </Button>
          <p className="mt-2.5 text-center text-[0.8rem] text-ink-faint">
            Al confirmar aceptas nuestros términos y condiciones.
          </p>
        </div>
      </aside>
    </form>
  );
}

/** Empty state: the checkout was reached with no items in the local cart. */
function CheckoutVacio() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-paper-2 px-6 py-16 text-center">
      <span
        aria-hidden="true"
        className="grid size-16 place-items-center rounded-[var(--radius-lg)] bg-paper-3 text-ink-faint"
      >
        <ShoppingBag className="size-8" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-step-2 font-semibold text-ink">
          Tu carrito está vacío
        </h2>
        <p className="mx-auto max-w-md text-step-0 text-ink-soft">
          No hay útiles para finalizar la compra. Agrega productos desde el
          catálogo y vuelve cuando estés listo.
        </p>
      </div>
      <Button asChildLink href="/catalogo" variant="accent" size="lg">
        Ir al catálogo
      </Button>
    </div>
  );
}

/** Placeholder while the store hydrates (avoids a false "empty"). */
function CheckoutSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
    >
      <div className="flex flex-col gap-8">
        <div className="pn-shimmer h-72 rounded-[var(--radius-lg)] border border-line bg-paper-2" />
        <div className="pn-shimmer h-56 rounded-[var(--radius-lg)] border border-line bg-paper-2" />
      </div>
      <div className="pn-shimmer h-96 rounded-[var(--radius-lg)] border border-line bg-paper-2" />
    </div>
  );
}
