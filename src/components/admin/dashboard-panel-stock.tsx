import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DataTable,
  EmptyStateAdmin,
  type ColumnaTabla,
} from "@/components/admin";
import { cn } from "@/lib/utils";
import { UMBRAL_STOCK_BAJO } from "@/lib/validators/admin";
import type { ProductoStockBajo } from "@/server/admin/metricas";

/**
 * dashboard-panel-stock — compact "Stock bajo" panel of the dashboard.
 *
 * Server Component: it receives the active products with stock <= UMBRAL (already
 * serialized) and renders them in a compact DataTable. The stock is tinted by
 * severity (0 = rose/out of stock, >0 = amber/critical) BUT always with text
 * ("X uds." / "Agotado"), never by color alone. Each row links to editing the
 * product; the footer leads to the inventory filtered by low stock.
 */

/** Critical threshold (0): no stock counts as out of stock (rose); >0 as critical (amber). */
function tonoStock(stock: number): { clase: string; etiqueta: string } {
  if (stock <= 0) {
    return {
      clase: "bg-rose-50 text-rose border border-rose/30",
      etiqueta: "Agotado",
    };
  }
  return {
    clase: "bg-amber-50 text-amber border border-amber/40",
    etiqueta: `${stock} ${stock === 1 ? "unidad" : "unidades"}`,
  };
}

const columnas: ColumnaTabla<ProductoStockBajo>[] = [
  {
    clave: "nombre",
    encabezado: "Producto",
    render: (p) => (
      <Link
        href={`/admin/productos/${p.id}/editar`}
        className="font-medium text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-sm)]"
      >
        {p.nombre}
      </Link>
    ),
  },
  {
    clave: "categoria",
    encabezado: "Categoría",
    render: (p) => <span className="text-ink-soft">{p.categoria}</span>,
  },
  {
    clave: "stock",
    encabezado: "Existencias",
    alinear: "right",
    render: (p) => {
      const { clase, etiqueta } = tonoStock(p.stock);
      return (
        <span
          className={cn(
            "inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-step--1 font-semibold tabular-nums",
            clase,
          )}
        >
          {etiqueta}
        </span>
      );
    },
  },
];

export function DashboardPanelStock({
  productos,
}: {
  productos: ProductoStockBajo[];
}) {
  return (
    <section
      aria-labelledby="dashboard-stock-bajo"
      className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper shadow-card"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2
            id="dashboard-stock-bajo"
            className="font-display text-step-1 font-semibold leading-tight text-ink"
          >
            Stock bajo
          </h2>
          <p className="text-step--1 text-ink-soft">
            Productos activos con {UMBRAL_STOCK_BAJO} unidades o menos.
          </p>
        </div>
        <Link
          href="/admin/productos?estado=stock-bajo"
          className="inline-flex items-center gap-1 whitespace-nowrap text-step--1 font-medium text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-[var(--radius-sm)]"
        >
          Ver inventario
          <ArrowRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </Link>
      </header>
      <div className="p-3 sm:p-4">
        <DataTable
          caption="Productos con existencias bajas que requieren reabastecimiento."
          claveFila={(p) => p.id}
          columnas={columnas}
          filas={productos}
          className="border-0 shadow-none"
          vacio={
            <EmptyStateAdmin
              titulo="Inventario saludable"
              descripcion="Ningún producto activo está por debajo del umbral de stock."
            />
          }
        />
      </div>
    </section>
  );
}
