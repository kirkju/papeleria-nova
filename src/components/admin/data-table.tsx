import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * DataTable<T> — the admin's generic, typed data table.
 *
 * Server-friendly: it does NOT handle sorting/search/pagination. Those travel in
 * searchParams and are resolved by the PAGE (it queries Prisma + builds the rows
 * and the pagination). This component ONLY renders what it receives, with good
 * semantics and accessibility:
 *   - <table> with an sr-only <caption> (described by `caption`).
 *   - <th scope="col"> on each header.
 *   - subtle zebra, row hover, per-column alignment.
 *   - horizontal scroll on mobile/tablet with an INDICATOR SHADOW (gradients with
 *     background-attachment: local, no JS) that appears when there is hidden
 *     content on the left/right.
 *
 * Each cell is rendered per column: `render(fila)` for custom cells
 * (badges, buttons, currency format) or, by default, `String(fila[clave])`.
 * `claveFila(fila)` must return a stable key (id) for React.
 *
 * Types:
 *   ColumnaTabla<T> = { clave, encabezado, alinear?, render?, ancho?, className? }
 *
 * Usage:
 *   <DataTable
 *     caption="Lista de pedidos recientes"
 *     claveFila={(p) => p.id}
 *     columnas={[
 *       { clave: "numero", encabezado: "Pedido" },
 *       { clave: "total", encabezado: "Total", alinear: "right",
 *         render: (p) => formatearLempiras(p.total) },
 *       { clave: "estado", encabezado: "Estado",
 *         render: (p) => <StatusBadge estado={p.estado} /> },
 *     ]}
 *     filas={pedidos}
 *     vacio={<EmptyStateAdmin titulo="Sin pedidos" />}
 *   />
 */
export interface ColumnaTabla<T> {
  /** Column identifier; if there is no `render`, it is used as the cell's key. */
  clave: keyof T | string;
  encabezado: React.ReactNode;
  /** Alignment of the column's content (header and cells). */
  alinear?: "left" | "center" | "right";
  /** Custom cell render. If missing, String(fila[clave]) is printed. */
  render?: (fila: T) => React.ReactNode;
  /** Optional fixed width (CSS, e.g. "10rem", "120px"). */
  ancho?: string;
  /** Extra classes for the <td>s of this column. */
  className?: string;
}

const alineacion = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

export function DataTable<T>({
  columnas,
  filas,
  claveFila,
  vacio,
  caption,
  className,
}: {
  columnas: ColumnaTabla<T>[];
  filas: T[];
  claveFila: (fila: T) => string;
  /** Content to show when there are no rows (e.g. <EmptyStateAdmin />). */
  vacio?: React.ReactNode;
  /** Accessible description of the DataTable (sr-only). */
  caption?: string;
  className?: string;
}) {
  const vacia = filas.length === 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper",
        className,
      )}
    >
      <div className="pn-scroll-sombra overflow-x-auto">
        <table className="w-full border-collapse text-step--1">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-line bg-paper-2">
              {columnas.map((col, i) => (
                <th
                  key={String(col.clave) + i}
                  scope="col"
                  style={col.ancho ? { width: col.ancho } : undefined}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 font-semibold text-ink-soft",
                    alineacion[col.alinear ?? "left"],
                  )}
                >
                  {col.encabezado}
                </th>
              ))}
            </tr>
          </thead>
          {!vacia ? (
            <tbody>
              {filas.map((fila) => (
                <tr
                  key={claveFila(fila)}
                  className="border-b border-line/70 odd:bg-paper even:bg-paper-2/40 transition-colors last:border-b-0 hover:bg-paper-3/60"
                >
                  {columnas.map((col, i) => (
                    <td
                      key={String(col.clave) + i}
                      className={cn(
                        "px-4 py-3 align-middle text-ink",
                        alineacion[col.alinear ?? "left"],
                        col.className,
                      )}
                    >
                      {col.render
                        ? col.render(fila)
                        : renderPorDefecto(fila, col.clave)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ) : null}
        </table>
      </div>

      {vacia ? (
        <div className="border-t border-line">
          {vacio ?? <VacioPorDefecto />}
        </div>
      ) : null}
    </div>
  );
}

function renderPorDefecto<T>(fila: T, clave: keyof T | string): React.ReactNode {
  const valor = (fila as Record<string, unknown>)[String(clave)];
  if (valor == null) return <span className="text-ink-faint">—</span>;
  return String(valor);
}

function VacioPorDefecto() {
  return (
    <p className="px-6 py-10 text-center text-step-0 text-ink-soft">
      No hay datos para mostrar.
    </p>
  );
}

/**
 * TablaSkeleton — loading placeholder with the same column/row layout.
 * Use it in a <Suspense fallback> or while the page resolves the query.
 * `columnas` = number of columns; `filas` = ghost rows (default 6).
 */
export function TablaSkeleton({
  columnas,
  filas = 6,
  className,
}: {
  columnas: number;
  filas?: number;
  className?: string;
}) {
  const cols = Math.max(1, columnas);
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper",
        className,
      )}
    >
      <span className="sr-only">Cargando datos…</span>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line bg-paper-2">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <span className="block h-3.5 w-20 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filas }).map((_, r) => (
              <tr key={r} className="border-b border-line/70 last:border-b-0">
                {Array.from({ length: cols }).map((__, c) => (
                  <td key={c} className="px-4 py-3.5">
                    <span
                      className="block h-3.5 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer"
                      style={{ width: `${50 + ((r + c) % 4) * 12}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
