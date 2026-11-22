/**
 * loading.tsx of /cuenta/pedidos — row-card skeletons while the list
 * loads. Same visual grain as CuentaPedidoFila (chip + texts + total) with a
 * soft pulse. `animate-pulse` is disabled under prefers-reduced-motion (the
 * project's global rule in globals.css). aria-hidden: it is placeholder content.
 */
const FILAS = Array.from({ length: 5 });

export default function CargandoMisPedidos() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="h-4 w-40 rounded-[var(--radius-sm)] bg-paper-3" />

      <ul role="list" className="flex flex-col gap-3">
        {FILAS.map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-4 shadow-card sm:p-5"
          >
            <span className="size-11 shrink-0 animate-pulse rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-paper-3" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="h-5 w-28 animate-pulse rounded-[var(--radius-sm)] bg-paper-3" />
                <span className="h-5 w-20 animate-pulse rounded-[var(--radius-sm)] bg-paper-3" />
              </div>
              <span className="h-3.5 w-40 animate-pulse rounded-[var(--radius-sm)] bg-paper-3" />
            </div>
            <span className="h-7 w-24 shrink-0 animate-pulse rounded-[var(--radius-sm)] bg-paper-3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
