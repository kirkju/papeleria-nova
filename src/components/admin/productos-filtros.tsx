import { Search } from "lucide-react";
import {
  ESTADOS_PRODUCTO_FILTRO,
  ORDENES_PRODUCTO,
  type FiltrosProductosAdmin,
} from "@/lib/validators/admin";
import type { CategoriaOpcion } from "@/server/admin/productos";
import { cn } from "@/lib/utils";

/**
 * ProductosFiltros — filters bar of the admin products table.
 *
 * Server Component: it is an accessible <form method="GET"> that points to
 * /admin/productos. The URL/searchParams is the source of truth (same pattern as
 * the catalog): on submit the page reloads on the server with the new
 * filters. It needs no JavaScript to work.
 *
 * Fields (URL contract: ?q= cat= estado= orden=):
 *  - q: search by name / SKU / brand.
 *  - cat: category slug.
 *  - estado: todos | activos | inactivos | stock-bajo.
 *  - orden: recientes | nombre | precio | stock.
 *
 * Every submit OMITS `page` (it goes back to page 1) because no page field
 * is included. The "Limpiar" button is a link to /admin/productos with no parameters.
 */

const ETIQUETA_ESTADO_FILTRO: Record<
  (typeof ESTADOS_PRODUCTO_FILTRO)[number],
  string
> = {
  todos: "Todos los estados",
  activos: "Activos",
  inactivos: "Inactivos",
  "stock-bajo": "Stock bajo",
};

const claseControl = cn(
  "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 text-step-0 text-ink",
  "placeholder:text-ink-faint transition-[border-color,box-shadow] duration-200 ease-out",
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);

const claseSelect = cn(
  claseControl,
  "pr-9 appearance-none bg-[length:1.1em] bg-[right_0.75rem_center] bg-no-repeat",
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a463e%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
);

export function ProductosFiltros({
  filtros,
  categorias,
  hayFiltrosActivos,
}: {
  filtros: FiltrosProductosAdmin;
  categorias: CategoriaOpcion[];
  hayFiltrosActivos: boolean;
}) {
  return (
    <form
      method="GET"
      action="/admin/productos"
      role="search"
      aria-label="Filtrar productos"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-4 shadow-card"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Search */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-q"
            className="text-[0.8rem] font-medium text-ink-soft"
          >
            Buscar
          </label>
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 flex text-ink-faint"
            >
              <Search className="size-4.5" strokeWidth={2} />
            </span>
            <input
              id="filtro-q"
              type="search"
              name="q"
              defaultValue={filtros.q ?? ""}
              placeholder="Nombre, SKU o marca…"
              className={cn(claseControl, "pl-10")}
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-cat"
            className="text-[0.8rem] font-medium text-ink-soft"
          >
            Categoría
          </label>
          <select
            id="filtro-cat"
            name="cat"
            defaultValue={filtros.cat ?? ""}
            className={claseSelect}
          >
            <option value="">Todas</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-estado"
            className="text-[0.8rem] font-medium text-ink-soft"
          >
            Estado
          </label>
          <select
            id="filtro-estado"
            name="estado"
            defaultValue={filtros.estado}
            className={claseSelect}
          >
            {ESTADOS_PRODUCTO_FILTRO.map((e) => (
              <option key={e} value={e}>
                {ETIQUETA_ESTADO_FILTRO[e]}
              </option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-orden"
            className="text-[0.8rem] font-medium text-ink-soft"
          >
            Ordenar por
          </label>
          <select
            id="filtro-orden"
            name="orden"
            defaultValue={filtros.orden}
            className={claseSelect}
          >
            {ORDENES_PRODUCTO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {hayFiltrosActivos ? (
          <a
            href="/admin/productos"
            className="inline-flex h-10 items-center rounded-[var(--radius-md)] px-4 text-step--1 font-medium text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Limpiar filtros
          </a>
        ) : null}
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] bg-primary px-5 text-step--1 font-medium text-on-primary shadow-card transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          <Search aria-hidden="true" className="size-4" strokeWidth={2.5} />
          Aplicar
        </button>
      </div>
    </form>
  );
}
