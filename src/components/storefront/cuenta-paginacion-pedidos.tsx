import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CuentaPaginacionPedidos — simple pagination for the account's order
 * list (Server Component). The URL is the source of truth (?page=N).
 *
 * "Anterior / counter / Siguiente" pattern: suitable for a personal list
 * (there are not as many pages as in the catalog). It builds the links on
 * /cuenta/pedidos preserving only `page` (it omits page=1 for a clean URL). It
 * marks the ends as disabled (span, not Link) and exposes an accessible
 * "Página X de Y" counter. Returns null if there is only one page.
 *
 * Usage:
 *   <CuentaPaginacionPedidos pagina={data.pagina} totalPaginas={data.totalPaginas} />
 */
export function CuentaPaginacionPedidos({
  pagina,
  totalPaginas,
}: {
  pagina: number;
  totalPaginas: number;
}) {
  if (totalPaginas <= 1) return null;

  const hrefPagina = (n: number): string =>
    n <= 1 ? "/cuenta/pedidos" : `/cuenta/pedidos?page=${n}`;

  const hayPrev = pagina > 1;
  const haySig = pagina < totalPaginas;

  return (
    <nav
      aria-label="Paginación de pedidos"
      className="flex items-center justify-between gap-3"
    >
      {hayPrev ? (
        <Link href={hrefPagina(pagina - 1)} rel="prev" className={claseEnlace(false)}>
          <ChevronLeft aria-hidden="true" className="size-4.5" strokeWidth={2} />
          <span>Anterior</span>
        </Link>
      ) : (
        <span aria-hidden="true" className={claseEnlace(true)}>
          <ChevronLeft className="size-4.5" strokeWidth={2} />
          <span>Anterior</span>
        </span>
      )}

      <p aria-live="polite" className="text-[0.85rem] font-medium text-ink-soft">
        Página <span className="tabular-nums text-ink">{pagina}</span> de{" "}
        <span className="tabular-nums text-ink">{totalPaginas}</span>
      </p>

      {haySig ? (
        <Link href={hrefPagina(pagina + 1)} rel="next" className={claseEnlace(false)}>
          <span>Siguiente</span>
          <ChevronRight aria-hidden="true" className="size-4.5" strokeWidth={2} />
        </Link>
      ) : (
        <span aria-hidden="true" className={claseEnlace(true)}>
          <span>Siguiente</span>
          <ChevronRight className="size-4.5" strokeWidth={2} />
        </span>
      )}
    </nav>
  );
}

function claseEnlace(inactivo: boolean): string {
  return cn(
    "inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 text-[0.9rem] font-medium text-ink",
    inactivo
      ? "opacity-45"
      : "transition-colors hover:border-line-strong hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
  );
}
