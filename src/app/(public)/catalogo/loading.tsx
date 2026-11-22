import { ProductGridSkeleton } from "@/components/storefront/product-card-skeleton";

/**
 * Loading state of the catalog. It replicates the header and the grid with skeletons
 * (subtle shimmer, motionless under prefers-reduced-motion). Decorative: the grid already
 * announces "Cargando productos…" via aria-live in ProductGridSkeleton.
 */
export default function CatalogoLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
      {/* Header skeleton */}
      <header className="mb-6">
        <span
          aria-hidden="true"
          className="pn-shimmer block h-3 w-28 rounded-[var(--radius-pill)] bg-paper-3"
        />
        <span
          aria-hidden="true"
          className="pn-shimmer mt-3 block h-8 w-56 rounded-[var(--radius-sm)] bg-paper-3"
        />
        <span
          aria-hidden="true"
          className="pn-shimmer mt-3 block h-4 w-44 rounded-[var(--radius-sm)] bg-paper-3"
        />
      </header>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
        {/* Sidebar skeleton (hidden on mobile, like the real fixed panel) */}
        <aside
          aria-hidden="true"
          className="hidden flex-col gap-6 lg:flex lg:sticky lg:top-24 lg:self-start"
        >
          {Array.from({ length: 4 }).map((_, bloque) => (
            <div key={bloque} className="flex flex-col gap-2.5">
              <span className="pn-shimmer h-4 w-24 rounded-[var(--radius-sm)] bg-paper-3" />
              {Array.from({ length: 4 }).map((_, fila) => (
                <span
                  key={fila}
                  className="pn-shimmer h-7 w-full rounded-[var(--radius-md)] bg-paper-3"
                />
              ))}
            </div>
          ))}
        </aside>

        {/* Results skeleton */}
        <section aria-label="Cargando catálogo">
          <div className="mb-5 flex items-center justify-between">
            <span
              aria-hidden="true"
              className="pn-shimmer h-4 w-40 rounded-[var(--radius-sm)] bg-paper-3"
            />
            <span
              aria-hidden="true"
              className="pn-shimmer h-11 w-48 rounded-[var(--radius-md)] bg-paper-3"
            />
          </div>
          <ProductGridSkeleton />
        </section>
      </div>
    </div>
  );
}
