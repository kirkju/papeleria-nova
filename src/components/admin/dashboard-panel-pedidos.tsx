import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DataTable,
  EmptyStateAdmin,
  StatusBadge,
  type ColumnaTabla,
} from "@/components/admin";
import { formatearLempiras } from "@/lib/utils";
import type { PedidoReciente } from "@/server/admin/metricas";

/**
 * dashboard-panel-pedidos — compact "Pedidos recientes" panel of the dashboard.
 *
 * Server Component: it receives the orders already serialized (total: number,
 * creadoEn: ISO string) from the page and renders them in a compact DataTable.
 * Each row links to its detail (/admin/pedidos/<id>) and the footer offers
 * "Ver todos". The status is shown with StatusBadge (color + icon + text, never
 * color alone).
 *
 * The dates arrive as ISO and are formatted to DD/MM/YYYY here (no Date crosses).
 */

const formateadorFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatearFechaCorta(iso: string): string {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return formateadorFecha.format(fecha);
}

const columnas: ColumnaTabla<PedidoReciente>[] = [
  {
    clave: "numero",
    encabezado: "Pedido",
    render: (p) => (
      <Link
        href={`/admin/pedidos/${p.id}`}
        className="font-medium text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-sm)]"
      >
        {p.numero}
      </Link>
    ),
  },
  {
    clave: "cliente",
    encabezado: "Cliente",
    render: (p) => <span className="truncate">{p.cliente}</span>,
  },
  {
    clave: "creadoEn",
    encabezado: "Fecha",
    render: (p) => (
      <span className="whitespace-nowrap tabular-nums text-ink-soft">
        {formatearFechaCorta(p.creadoEn)}
      </span>
    ),
  },
  {
    clave: "estado",
    encabezado: "Estado",
    render: (p) => <StatusBadge estado={p.estado} />,
  },
  {
    clave: "total",
    encabezado: "Total",
    alinear: "right",
    render: (p) => (
      <span className="whitespace-nowrap font-semibold tabular-nums">
        {formatearLempiras(p.total)}
      </span>
    ),
  },
];

export function DashboardPanelPedidos({
  pedidos,
}: {
  pedidos: PedidoReciente[];
}) {
  return (
    <section
      aria-labelledby="dashboard-pedidos-recientes"
      className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper shadow-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2
          id="dashboard-pedidos-recientes"
          className="font-display text-step-1 font-semibold leading-tight text-ink"
        >
          Pedidos recientes
        </h2>
        <Link
          href="/admin/pedidos"
          className="inline-flex items-center gap-1 text-step--1 font-medium text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-sm)]"
        >
          Ver todos
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </Link>
      </header>
      <div className="p-3 sm:p-4">
        <DataTable
          caption="Últimos pedidos creados, con su estado y total."
          claveFila={(p) => p.id}
          columnas={columnas}
          filas={pedidos}
          className="border-0 shadow-none"
          vacio={
            <EmptyStateAdmin
              titulo="Sin pedidos todavía"
              descripcion="Cuando entren pedidos aparecerán aquí los más recientes."
            />
          }
        />
      </div>
    </section>
  );
}
