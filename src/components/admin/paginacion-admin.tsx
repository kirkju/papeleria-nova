import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PaginacionAdmin — server-side pagination for the admin tables.
 *
 * Same contract as PaginacionCatalogo, but generic with respect to the route:
 * the hrefs hang off `basePath` (the admin's current route) instead of
 * /catalogo. It PRESERVES the other searchParams (search, filters, order),
 * changing only `page`. Returns null if totalPaginas <= 1.
 *
 * DECISION: it is a pure Server Component (zero JS). Instead of reading usePathname
 * (which would force "use client"), the PAGE passes its own route in `basePath`.
 * That way the pagination renders on the server next to the table, without hydrating.
 * `paramsActuales` are the string searchParams already resolved by the page.
 *
 * Usage (in a server page, e.g. /admin/pedidos):
 *   <PaginacionAdmin
 *     pagina={pagina}
 *     totalPaginas={totalPaginas}
 *     basePath="/admin/pedidos"
 *     paramsActuales={paramsString}  // Record<string,string> without "page"
 *   />
 */
export function PaginacionAdmin({
  pagina,
  totalPaginas,
  basePath,
  paramsActuales,
}: {
  pagina: number;
  totalPaginas: number;
  basePath: string;
  paramsActuales: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  const hrefPagina = (n: number): string => {
    const params = new URLSearchParams(paramsActuales);
    if (n <= 1) params.delete("page");
    else params.set("page", String(n));
    const qs = params.toString();
    return `${basePath}${qs ? `?${qs}` : ""}`;
  };

  const items = construirRango(pagina, totalPaginas);
  const hayPrev = pagina > 1;
  const haySig = pagina < totalPaginas;

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-step--1 text-ink-faint tabular-nums">
        Página {pagina} de {totalPaginas}
      </p>

      <div className="flex items-center gap-1.5">
        {hayPrev ? (
          <Link
            href={hrefPagina(pagina - 1)}
            rel="prev"
            aria-label="Página anterior"
            className={enlaceClase()}
          >
            <ChevronLeft aria-hidden="true" className="size-4.5" strokeWidth={2} />
            <span className="hidden sm:inline">Anterior</span>
          </Link>
        ) : (
          <span aria-hidden="true" className={enlaceClaseInactiva()}>
            <ChevronLeft className="size-4.5" strokeWidth={2} />
            <span className="hidden sm:inline">Anterior</span>
          </span>
        )}

        <ul className="flex items-center gap-1" role="list">
          {items.map((item, i) =>
            item === "…" ? (
              <li
                key={`gap-${i}`}
                aria-hidden="true"
                className="select-none px-1.5 text-ink-faint"
              >
                …
              </li>
            ) : (
              <li key={item}>
                {item === pagina ? (
                  <span aria-current="page" className={numeroClase(true)}>
                    {item}
                  </span>
                ) : (
                  <Link
                    href={hrefPagina(item)}
                    aria-label={`Ir a la página ${item}`}
                    className={numeroClase(false)}
                  >
                    {item}
                  </Link>
                )}
              </li>
            ),
          )}
        </ul>

        {haySig ? (
          <Link
            href={hrefPagina(pagina + 1)}
            rel="next"
            aria-label="Página siguiente"
            className={enlaceClase()}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight aria-hidden="true" className="size-4.5" strokeWidth={2} />
          </Link>
        ) : (
          <span aria-hidden="true" className={enlaceClaseInactiva()}>
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-4.5" strokeWidth={2} />
          </span>
        )}
      </div>
    </nav>
  );
}

/* ── Classes ────────────────────────────────────────────────────────────────── */

function enlaceClase(): string {
  return cn(
    "inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-line bg-paper px-3 text-[0.85rem] font-medium text-ink",
    "transition-colors hover:bg-paper-3 hover:border-line-strong",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  );
}

function enlaceClaseInactiva(): string {
  return "inline-flex h-9 items-center gap-1 rounded-[var(--radius-md)] border border-line bg-paper px-3 text-[0.85rem] font-medium text-ink-faint opacity-50";
}

function numeroClase(activo: boolean): string {
  return cn(
    "inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] text-[0.85rem] font-semibold tabular-nums",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    activo
      ? "bg-primary text-on-primary shadow-card"
      : "border border-line bg-paper text-ink hover:bg-paper-3 hover:border-line-strong",
  );
}

/* ── Range with ellipsis ────────────────────────────────────────────────────── */

/**
 * List of pages to show, with "…". It always includes 1 and the last one; around
 * the current one it shows one neighbor on each side.
 */
function construirRango(actual: number, total: number): (number | "…")[] {
  const ventana = 1;
  const paginas = new Set<number>([1, total, actual]);
  for (let i = 1; i <= ventana; i += 1) {
    if (actual - i >= 1) paginas.add(actual - i);
    if (actual + i <= total) paginas.add(actual + i);
  }
  const ordenadas = [...paginas].sort((a, b) => a - b);

  const resultado: (number | "…")[] = [];
  let previa = 0;
  for (const p of ordenadas) {
    if (previa && p - previa > 1) resultado.push("…");
    resultado.push(p);
    previa = p;
  }
  return resultado;
}
