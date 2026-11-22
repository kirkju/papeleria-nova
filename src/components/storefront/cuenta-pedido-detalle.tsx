import * as React from "react";
import {
  Clock,
  CreditCard,
  Truck,
  PackageCheck,
  XCircle,
  Check,
  type LucideIcon,
} from "lucide-react";
import { StatusBadge, type EstadoPedido } from "@/components/admin/status-badge";
import { formatearLempiras, cn } from "@/lib/utils";

/**
 * CuentaPedidoDetalle — detail view of a customer's order (Server
 * Component, no "use client"). A different tone from PedidoConfirmado (which is
 * the checkout's "thank you"): this is a lookup, not a celebration.
 *
 * Composition:
 *  - Header: number (display), StatusBadge and date (DD/MM/YYYY, already formatted).
 *  - Status progress: PENDIENTE → PAGADO → ENVIADO → ENTREGADO with marked
 *    steps. CANCELADO is shown as a separate rose band (it does not fit in the
 *    line). Accessible: each step carries text and state via aria-label/sr-only,
 *    not just color. No animations (only transition-colors, harmless).
 *  - Items (snapshots): name, SKU, quantity × price, line subtotal.
 *  - Totals: subtotal, shipping ("Gratis" if 0), total.
 *  - Formatted shipping address.
 *  - Contact note linking to /contacto.
 *
 * All money goes through formatearLempiras. The date arrives already formatted
 * (no Date crosses). It receives the order already serialized by the page.
 *
 * Usage:
 *   <CuentaPedidoDetalle pedido={pedido} fecha={formatear(pedido.creadoEn)} />
 */
export interface CuentaPedidoDetalleProps {
  pedido: {
    numero: string;
    estado: EstadoPedido;
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
  /** Date already formatted as DD/MM/YYYY by the page. */
  fecha: string;
}

/** Steps of an order's normal flow (without CANCELADO, which is shown separately). */
const PASOS: { estado: Exclude<EstadoPedido, "CANCELADO">; etiqueta: string; icono: LucideIcon }[] =
  [
    { estado: "PENDIENTE", etiqueta: "Pendiente", icono: Clock },
    { estado: "PAGADO", etiqueta: "Pagado", icono: CreditCard },
    { estado: "ENVIADO", etiqueta: "Enviado", icono: Truck },
    { estado: "ENTREGADO", etiqueta: "Entregado", icono: PackageCheck },
  ];

export function CuentaPedidoDetalle({ pedido, fecha }: CuentaPedidoDetalleProps) {
  const cancelado = pedido.estado === "CANCELADO";
  const envioGratis = pedido.envio === 0;
  const totalArticulos = pedido.items.reduce((acc, i) => acc + i.cantidad, 0);

  // Index of the current step within the normal flow (-1 if canceled).
  const indiceActual = cancelado
    ? -1
    : PASOS.findIndex((p) => p.estado === pedido.estado);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-[0.78rem] font-medium uppercase tracking-wide text-ink-faint">
            Pedido
          </span>
          <h1 className="font-display text-step-3 font-bold leading-none tracking-tight text-ink tabular-nums">
            {pedido.numero}
          </h1>
          <p className="text-[0.85rem] text-ink-soft">
            Realizado el <span className="tabular-nums">{fecha}</span>
          </p>
        </div>
        <StatusBadge estado={pedido.estado} />
      </header>

      {/* Status progress */}
      {cancelado ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-rose/30 bg-rose-50 p-5"
        >
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-paper text-rose"
          >
            <XCircle className="size-5.5" strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-step-1 font-semibold text-rose">
              Pedido cancelado
            </p>
            <p className="mt-0.5 text-[0.9rem] text-ink-soft">
              Este pedido fue cancelado. Si crees que es un error,{" "}
              <a
                href="/contacto"
                className="font-medium text-primary-600 underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
              >
                escríbenos
              </a>
              .
            </p>
          </div>
        </div>
      ) : (
        <section
          aria-label="Progreso del pedido"
          className="rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card sm:p-6"
        >
          <ol
            role="list"
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-2"
          >
            {PASOS.map((paso, i) => {
              const completado = i < indiceActual;
              const actual = i === indiceActual;
              const Icono = paso.icono;
              const estadoTexto = completado
                ? "Completado"
                : actual
                  ? "Estado actual"
                  : "Pendiente";

              return (
                <li
                  key={paso.estado}
                  aria-current={actual ? "step" : undefined}
                  aria-label={`${paso.etiqueta}: ${estadoTexto}`}
                  className="relative flex flex-1 items-center gap-3 sm:flex-col sm:gap-2 sm:text-center"
                >
                  {/* Connector to the next step (decorative). */}
                  {i < PASOS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-5 top-10 h-[calc(100%-1rem)] w-0.5 sm:left-[calc(50%+1.25rem)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-2.5rem)]",
                        i < indiceActual ? "bg-mint" : "bg-line",
                      )}
                    />
                  )}

                  <span
                    aria-hidden="true"
                    className={cn(
                      "z-[1] grid size-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      completado &&
                        "border-mint bg-mint text-on-primary",
                      actual &&
                        "border-primary bg-primary-50 text-primary-600 ring-4 ring-primary/10",
                      !completado &&
                        !actual &&
                        "border-line bg-paper text-ink-faint",
                    )}
                  >
                    {completado ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : (
                      <Icono className="size-5" strokeWidth={2} />
                    )}
                  </span>

                  <span className="flex flex-col">
                    <span
                      className={cn(
                        "text-[0.9rem] font-semibold leading-tight",
                        actual
                          ? "text-primary-600"
                          : completado
                            ? "text-ink"
                            : "text-ink-faint",
                      )}
                    >
                      {paso.etiqueta}
                    </span>
                    <span className="text-[0.75rem] text-ink-faint">
                      {estadoTexto}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* Items + totals */}
      <section
        aria-label="Artículos del pedido"
        className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-2 shadow-card"
      >
        <div className="flex items-baseline justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-display text-step-1 font-semibold text-ink">
            Tus útiles
          </h2>
          <span className="text-[0.85rem] text-ink-soft tabular-nums">
            {totalArticulos === 1 ? "1 artículo" : `${totalArticulos} artículos`}
          </span>
        </div>

        <ul role="list" className="flex flex-col divide-y divide-line/70 px-5 sm:px-6">
          {pedido.items.map((item) => (
            <li
              key={item.sku}
              className="flex items-start justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{item.nombre}</p>
                <p className="mt-0.5 text-[0.75rem] uppercase tracking-wide text-ink-faint">
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
      </section>

      {/* Shipping address */}
      <section
        aria-label="Dirección de envío"
        className="rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card sm:p-6"
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600"
          >
            <Truck className="size-5" strokeWidth={1.85} />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-step-0 font-semibold text-ink">
              Envío a
            </h2>
            <address className="mt-1 text-[0.9rem] not-italic leading-relaxed text-ink-soft">
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
              <span className="tabular-nums">
                Tel. {pedido.direccion.telefono}
              </span>
            </address>
          </div>
        </div>
      </section>

      {/* Contact note */}
      <p className="rounded-[var(--radius-md)] bg-primary-50/60 px-4 py-3 text-center text-[0.9rem] text-ink-soft">
        ¿Algo no cuadra con tu pedido?{" "}
        <a
          href="/contacto"
          className="font-medium text-primary-600 underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          Escríbenos
        </a>{" "}
        y lo revisamos contigo.
      </p>
    </div>
  );
}
