import { Search } from "lucide-react";
import {
  ROLES_FILTRO,
  ESTADOS_USUARIO_FILTRO,
  type FiltrosUsuariosAdmin,
} from "@/lib/validators/usuarios";
import { cn } from "@/lib/utils";

/**
 * UsuariosFiltros — filters bar of the admin users table.
 *
 * Server Component: an accessible <form method="GET"> that points to /admin/usuarios.
 * The URL/searchParams is the source of truth (same pattern as products): on
 * submit the page reloads on the server with the new filters. It works without
 * JavaScript.
 *
 * URL contract (?q= rol= estado=). Every submit OMITS `page` (there is no page
 * field, so it goes back to page 1). "Limpiar filtros" is a link to /admin/usuarios
 * with no parameters.
 */

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

export function UsuariosFiltros({
  filtros,
  hayFiltrosActivos,
}: {
  filtros: FiltrosUsuariosAdmin;
  hayFiltrosActivos: boolean;
}) {
  return (
    <form
      method="GET"
      action="/admin/usuarios"
      role="search"
      aria-label="Filtrar usuarios"
      className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-4 shadow-card"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
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
              placeholder="Nombre o email…"
              className={cn(claseControl, "pl-10")}
            />
          </div>
        </div>

        {/* Role */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-rol"
            className="text-[0.8rem] font-medium text-ink-soft"
          >
            Rol
          </label>
          <select
            id="filtro-rol"
            name="rol"
            defaultValue={filtros.rol}
            className={claseSelect}
          >
            {ROLES_FILTRO.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
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
            {ESTADOS_USUARIO_FILTRO.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {hayFiltrosActivos ? (
          <a
            href="/admin/usuarios"
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
