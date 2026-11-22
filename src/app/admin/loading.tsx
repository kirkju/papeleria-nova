import { TablaSkeleton } from "@/components/admin";

/**
 * loading.tsx of the dashboard — skeleton while the queries resolve.
 *
 * It mirrors the real layout: header, a row of 4 StatCard tiles, charts (one wide +
 * two), and two DataTable panels (recent orders / low stock). It uses the system's
 * `pn-shimmer` class and respects `prefers-reduced-motion` (the shimmer
 * animation is toned down in that mode at the tokens/globals level).
 */
export default function AdminDashboardLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-8"
    >
      <span className="sr-only">Cargando el panel…</span>

      {/* Header */}
      <div className="flex flex-col gap-2.5">
        <span className="block h-8 w-56 rounded-[var(--radius-md)] bg-paper-3 pn-shimmer" />
        <span className="block h-4 w-80 max-w-full rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCardSkeleton className="xl:col-span-3" />
        <ChartCardSkeleton className="xl:col-span-2" />
        <ChartCardSkeleton />
      </div>

      {/* Table panels */}
      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-2">
        <PanelTablaSkeleton columnas={5} />
        <PanelTablaSkeleton columnas={3} />
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <span className="block h-3.5 w-28 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
        <span className="block size-9 rounded-[var(--radius-md)] bg-paper-3 pn-shimmer" />
      </div>
      <span className="block h-7 w-32 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
      <span className="block h-3.5 w-36 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
    </div>
  );
}

function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <section
      className={[
        "flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper shadow-card",
        className ?? "",
      ].join(" ")}
    >
      <header className="flex flex-col gap-1.5 border-b border-line px-5 py-4">
        <span className="block h-5 w-40 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
        <span className="block h-3.5 w-28 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
      </header>
      <div className="p-5">
        <span className="block h-[280px] w-full rounded-[var(--radius-md)] bg-paper-2 pn-shimmer" />
      </div>
    </section>
  );
}

function PanelTablaSkeleton({ columnas }: { columnas: number }) {
  return (
    <section className="flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper shadow-card">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <span className="block h-5 w-40 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
        <span className="block h-3.5 w-20 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
      </header>
      <div className="p-3 sm:p-4">
        <TablaSkeleton columnas={columnas} filas={5} className="border-0" />
      </div>
    </section>
  );
}
