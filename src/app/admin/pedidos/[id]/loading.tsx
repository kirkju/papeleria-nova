import { TablaSkeleton } from "@/components/admin";

/**
 * Loading state of an order's detail. It reproduces the breadcrumb, the header,
 * the three cards and a TablaSkeleton while the query resolves.
 */
export default function PedidoDetalleLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="flex flex-col gap-6"
    >
      <span className="sr-only">Cargando pedido…</span>

      <div
        aria-hidden="true"
        className="h-4 w-40 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer"
      />

      <div aria-hidden="true" className="flex flex-col gap-3">
        <div className="h-4 w-32 rounded-[var(--radius-sm)] bg-paper-3 pn-shimmer" />
        <div className="h-8 w-56 rounded-[var(--radius-md)] bg-paper-3 pn-shimmer" />
      </div>

      <div
        aria-hidden="true"
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-36 rounded-[var(--radius-lg)] border border-line bg-paper"
          />
        ))}
      </div>

      <TablaSkeleton columnas={5} filas={4} />

      <div
        aria-hidden="true"
        className="h-40 rounded-[var(--radius-lg)] border border-line bg-paper"
      />
    </div>
  );
}
