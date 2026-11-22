import Link from "next/link";
import { ChevronRight, Package } from "lucide-react";
import { StatusBadge, type EstadoPedido } from "@/components/admin/status-badge";
import { formatearLempiras } from "@/lib/utils";

/**
 * CuentaPedidoFila — row-card of an order in the account's list
 * (Server Component, mobile-first; it does NOT use the admin's DataTable).
 *
 * The whole card is a link to the order detail. It shows the number (in the
 * display font, tabular), the already formatted date (DD/MM/YYYY), the
 * StatusBadge, the total in Lempiras and the number of items. Money goes through
 * formatearLempiras. The date arrives already formatted from the page (no Date crosses).
 *
 * Usage:
 *   <CuentaPedidoFila
 *     numero={p.numero}
 *     estado={p.estado}
 *     fecha={formatear(p.creadoEn)}
 *     total={p.total}
 *     totalItems={p.totalItems}
 *   />
 */
export function CuentaPedidoFila({
  numero,
  estado,
  fecha,
  total,
  totalItems,
}: {
  numero: string;
  estado: EstadoPedido;
  /** Date already formatted as DD/MM/YYYY by the page. */
  fecha: string;
  total: number;
  totalItems: number;
}) {
  const itemsLabel =
    totalItems === 1 ? "1 artículo" : `${totalItems} artículos`;

  return (
    <Link
      href={`/cuenta/pedidos/${encodeURIComponent(numero)}`}
      className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-4 shadow-card transition-[box-shadow,border-color,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper sm:p-5"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600"
      >
        <Package className="size-5.5" strokeWidth={1.85} />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-display text-step-1 font-semibold tracking-tight text-ink tabular-nums">
            {numero}
          </span>
          <StatusBadge estado={estado} />
        </div>
        <p className="text-[0.85rem] text-ink-soft">
          <span className="tabular-nums">{fecha}</span>
          <span aria-hidden="true" className="mx-1.5 text-ink-faint">
            ·
          </span>
          {itemsLabel}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="text-right">
          <p className="text-[0.72rem] uppercase tracking-wide text-ink-faint">
            Total
          </p>
          <p className="font-display text-step-1 font-bold text-ink tabular-nums">
            {formatearLempiras(total)}
          </p>
        </div>
        <ChevronRight
          aria-hidden="true"
          className="size-5 text-ink-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary-600"
          strokeWidth={2}
        />
      </div>
    </Link>
  );
}
