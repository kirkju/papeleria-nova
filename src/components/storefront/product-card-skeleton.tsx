import { cn } from "@/lib/utils";

/**
 * ProductCardSkeleton / ProductGridSkeleton — loading skeletons of the catalog.
 *
 * They replicate the shape of ProductCard (square image + text + price) with a
 * subtle shimmer (`pn-shimmer` class in globals.css). Under
 * prefers-reduced-motion the shimmer stays still (only the base tone).
 * Decorative: marked with aria-hidden; the wrapper announces "Cargando…".
 *
 * Usage:
 *   <ProductGridSkeleton />            // 12 placeholders
 *   <ProductGridSkeleton cantidad={6} />
 *   <ProductCardSkeleton />            // a single one
 */
export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-paper-2 shadow-card"
    >
      <div className="pn-shimmer aspect-square w-full bg-paper-3" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <span className="pn-shimmer h-3 w-16 rounded-[var(--radius-pill)] bg-paper-3" />
        <span className="pn-shimmer h-4 w-full rounded-[var(--radius-sm)] bg-paper-3" />
        <span className="pn-shimmer h-4 w-3/5 rounded-[var(--radius-sm)] bg-paper-3" />
        <span className="pn-shimmer mt-2 h-6 w-24 rounded-[var(--radius-sm)] bg-paper-3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  cantidad = 12,
}: {
  cantidad?: number;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn(
        // It must match the real grid of the catalog (2 → md:3 → xl:4).
        "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4",
      )}
    >
      <span className="sr-only">Cargando productos…</span>
      {Array.from({ length: cantidad }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
