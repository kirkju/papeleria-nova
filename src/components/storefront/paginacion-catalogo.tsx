import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PaginacionCatalogo — page navigation of the catalog (Server Component).
 *
 * Builds links that PRESERVE the other searchParams (q, cat, filters,
 * sort), changing only `page`. Shows Anterior/Siguiente, numbers with an ellipsis
 * when there are many pages, `aria-current="page"` on the current one and
 * `aria-label="Paginación"`. Returns null if `totalPaginas <= 1`.
 *
 * Usage (in the catalog page, server):
 *   <PaginacionCatalogo
 *     pagina={pagina}
 *     totalPaginas={totalPaginas}
 *     paramsActuales={Object.fromEntries(
 *       Object.entries(sp).filter(([, v]) => typeof v === "string"),
 *     ) as Record<string, string>}
 *   />
 */
export function PaginacionCatalogo({
  pagina,
  totalPaginas,
  paramsActuales,
}: {
  pagina: number;
  totalPaginas: number;
  paramsActuales: Record<string, string>;
}) {
  if (totalPaginas <= 1) return null;

  const hrefPagina = (n: number): string => {
    const params = new URLSearchParams(paramsActuales);
    if (n <= 1) params.delete("page");
    else params.set("page", String(n));
    const qs = params.toString();
    return `/catalogo${qs ? `?${qs}` : ""}`;
  };

  const items = construirRango(pagina, totalPaginas);
  const hayPrev = pagina > 1;
  const haySig = pagina < totalPaginas;

  return (
    <nav
      aria-label="Paginación"
      className="flex items-center justify-center gap-1.5"
    >
      {/* Previous */}
      {hayPrev ? (
        <Link
          href={hrefPagina(pagina - 1)}
          rel="prev"
          aria-label="Página anterior"
          className={enlaceClase(false)}
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

      {/* Numbers */}
      <ul className="flex items-center gap-1" role="list">
        {items.map((item, i) =>
          item === "…" ? (
            <li
              key={`gap-${i}`}
              aria-hidden="true"
              className="px-1.5 text-ink-faint select-none"
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

      {/* Next */}
      {haySig ? (
        <Link
          href={hrefPagina(pagina + 1)}
          rel="next"
          aria-label="Página siguiente"
          className={enlaceClase(false)}
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight
            aria-hidden="true"
            className="size-4.5"
            strokeWidth={2}
          />
        </Link>
      ) : (
        <span aria-hidden="true" className={enlaceClaseInactiva()}>
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="size-4.5" strokeWidth={2} />
        </span>
      )}
    </nav>
  );
}

/* ── Classes ────────────────────────────────────────────────────────────────── */

function enlaceClase(_inactivo: boolean): string {
  void _inactivo;
  return cn(
    "inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 text-[0.9rem] font-medium text-ink",
    "transition-colors hover:bg-paper-3 hover:border-line-strong",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  );
}

function enlaceClaseInactiva(): string {
  return "inline-flex h-10 items-center gap-1 rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 text-[0.9rem] font-medium text-ink-faint opacity-50";
}

function numeroClase(activo: boolean): string {
  return cn(
    "inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-[0.9rem] font-semibold tabular-nums",
    "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    activo
      ? "bg-primary text-on-primary shadow-card"
      : "border border-line bg-paper-2 text-ink hover:bg-paper-3 hover:border-line-strong",
  );
}

/* ── Range with ellipsis ────────────────────────────────────────────────────── */

/**
 * Returns the list of pages to show, with "…" where appropriate.
 * It always includes 1 and the last one; around the current one it shows neighbors.
 */
function construirRango(
  actual: number,
  total: number,
): (number | "…")[] {
  const ventana = 1; // neighbors on each side of the current one
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
