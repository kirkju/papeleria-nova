import * as React from "react";
import { Truck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatearLempiras, cn } from "@/lib/utils";

/**
 * PedidoConfirmado — thank-you screen after creating an order.
 *
 * Server-friendly (no "use client"): it receives the order already serialized by
 * the page. Hero with a stationery character (paper stamp with a check + our own
 * SVG confetti), a prominent and visually copyable order number, a card with
 * the item detail, totals, formatted address, status as a Badge and CTAs.
 * All money goes through formatearLempiras; the date arrives already in DD/MM/YYYY.
 *
 * Usage:
 *   <PedidoConfirmado pedido={pedido} />
 */
export interface PedidoConfirmadoProps {
  pedido: {
    numero: string;
    estado: string;
    /** Date already formatted as DD/MM/YYYY by the page. */
    creadoEn: string;
    subtotal: number;
    envio: number;
    total: number;
    direccion: {
      nombre: string;
      linea1: string;
      linea2?: string | null;
      ciudad: string;
      departamento: string;
      telefono: string;
    };
    items: { nombre: string; sku: string; precio: number; cantidad: number }[];
  };
}

/** Maps the order status to its presentation (Badge + readable label). */
function presentacionEstado(estado: string): {
  variant: React.ComponentProps<typeof Badge>["variant"];
  etiqueta: string;
} {
  switch (estado) {
    case "PAGADO":
      return { variant: "nuevo", etiqueta: "Pagado" };
    case "PENDIENTE":
      return { variant: "stock-bajo", etiqueta: "Pendiente de pago" };
    case "ENVIADO":
      return { variant: "neutral", etiqueta: "Enviado" };
    case "ENTREGADO":
      return { variant: "nuevo", etiqueta: "Entregado" };
    case "CANCELADO":
      return { variant: "agotado", etiqueta: "Cancelado" };
    default:
      return { variant: "neutral", etiqueta: estado };
  }
}

export function PedidoConfirmado({ pedido }: PedidoConfirmadoProps) {
  const estado = presentacionEstado(pedido.estado);
  const envioGratis = pedido.envio === 0;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      {/* Thank-you hero */}
      <header className="flex flex-col items-center text-center">
        <SelloConfirmado className="h-28 w-auto" />
        <h1 className="mt-5 font-display text-step-3 font-bold text-ink">
          ¡Pedido confirmado!
        </h1>
        <p className="mt-2 max-w-md text-step-0 text-ink-soft">
          Gracias por tu compra. Guardamos tu pedido y te contactaremos para
          coordinar la entrega.
        </p>

        {/* Order number, prominent and visually copyable */}
        <div className="mt-5 inline-flex flex-col items-center gap-1">
          <span className="text-[0.78rem] font-medium uppercase tracking-wide text-ink-faint">
            Número de pedido
          </span>
          <span className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-primary/40 bg-primary-50/60 px-4 py-2 font-display text-step-1 font-bold tracking-wide text-primary tabular-nums select-all">
            {pedido.numero}
          </span>
        </div>
      </header>

      {/* Card with the order detail */}
      <section
        aria-label="Detalle del pedido"
        className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-2 shadow-card"
      >
        {/* Header: status + date */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper-3/40 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-paper text-primary"
            >
              <Package className="size-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-[0.78rem] text-ink-faint">Estado</p>
              <Badge variant={estado.variant}>{estado.etiqueta}</Badge>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.78rem] text-ink-faint">Fecha</p>
            <p className="text-step-0 font-medium text-ink tabular-nums">
              {pedido.creadoEn}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="px-5 py-4 sm:px-6">
          <h2 className="font-display text-step-1 font-semibold text-ink">
            Tus útiles
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-line/70">
            {pedido.items.map((item) => (
              <li
                key={item.sku}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{item.nombre}</p>
                  <p className="mt-0.5 text-[0.78rem] uppercase tracking-wide text-ink-faint">
                    SKU {item.sku}
                  </p>
                  <p className="mt-0.5 text-[0.85rem] text-ink-soft tabular-nums">
                    {item.cantidad} × {formatearLempiras(item.precio)}
                  </p>
                </div>
                <p className="shrink-0 font-display font-bold text-ink tabular-nums">
                  {formatearLempiras(item.precio * item.cantidad)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Totals */}
        <div className="border-t border-line px-5 py-4 sm:px-6">
          <dl className="flex flex-col gap-2 text-step-0">
            <div className="flex items-baseline justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-semibold text-ink tabular-nums">
                {formatearLempiras(pedido.subtotal)}
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
                {envioGratis ? "Gratis" : formatearLempiras(pedido.envio)}
              </dd>
            </div>
          </dl>
          <div className="my-3 border-t border-dashed border-line" />
          <div className="flex items-baseline justify-between">
            <span className="font-display text-step-1 font-semibold text-ink">
              Total
            </span>
            <span className="font-display text-step-2 font-bold text-ink tabular-nums">
              {formatearLempiras(pedido.total)}
            </span>
          </div>
        </div>

        {/* Shipping address */}
        <div className="border-t border-line bg-paper-3/30 px-5 py-4 sm:px-6">
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-paper text-primary"
            >
              <Truck className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h3 className="font-display text-step-0 font-semibold text-ink">
                Envío a
              </h3>
              <address className="mt-1 text-[0.9rem] not-italic text-ink-soft">
                <span className="font-medium text-ink">
                  {pedido.direccion.nombre}
                </span>
                <br />
                {pedido.direccion.linea1}
                {pedido.direccion.linea2 && (
                  <>
                    <br />
                    {pedido.direccion.linea2}
                  </>
                )}
                <br />
                {pedido.direccion.ciudad}, {pedido.direccion.departamento}
                <br />
                Tel. {pedido.direccion.telefono}
              </address>
            </div>
          </div>
        </div>
      </section>

      {/* Follow-up note */}
      <p className="mt-5 rounded-[var(--radius-md)] bg-primary-50/60 px-4 py-3 text-center text-[0.9rem] font-medium text-primary">
        Te contactaremos para coordinar la entrega.
      </p>

      {/* CTAs */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChildLink href="/catalogo" variant="accent" size="lg">
          Seguir comprando
        </Button>
        <Button asChildLink href="/" variant="outline" size="lg">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

/**
 * SelloConfirmado — paper stamp with a check + subtle confetti. Our own SVG
 * (not clipart), in the brand palette. Decorative (aria-hidden); the success
 * message is given by the <h1>.
 */
function SelloConfirmado({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 140"
      role="img"
      aria-label="Sello de pedido confirmado"
      className={className}
    >
      {/* Loose confetti around the stamp */}
      <g className="fill-accent">
        <rect x="20" y="30" width="7" height="7" rx="1.5" transform="rotate(18 23 33)" />
        <circle cx="138" cy="40" r="3.5" />
      </g>
      <g className="fill-amber">
        <rect x="132" y="78" width="7" height="7" rx="1.5" transform="rotate(-22 135 81)" />
        <circle cx="26" cy="86" r="3.5" />
      </g>
      <g className="fill-mint">
        <circle cx="44" cy="20" r="3" />
        <rect x="116" y="18" width="6" height="6" rx="1.5" transform="rotate(30 119 21)" />
      </g>
      <g className="fill-primary">
        <circle cx="74" cy="14" r="3" />
        <circle cx="100" cy="116" r="3" />
      </g>

      {/* Paper stamp: toothed circle (postage stamp) */}
      <g transform="translate(80 72)">
        <circle r="40" className="fill-primary-50 stroke-primary/30" strokeWidth="2" strokeDasharray="4 4" />
        <circle r="30" className="fill-mint" />
        {/* Check */}
        <path
          d="M-13 1 L-4 11 L14 -11"
          fill="none"
          className="stroke-on-primary"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
