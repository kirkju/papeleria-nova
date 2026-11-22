import { PageHeader, TablaSkeleton } from "@/components/admin";

/**
 * Loading state of the order list. It reproduces the header and a
 * TablaSkeleton with the same number of columns (7) to avoid layout shifts
 * while the Prisma query resolves.
 */
export default function PedidosLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Pedidos"
        descripcion="Busca, filtra y cambia el estado de los pedidos."
      />
      <div
        aria-hidden="true"
        className="h-[5.5rem] rounded-[var(--radius-lg)] border border-line bg-paper"
      />
      <TablaSkeleton columnas={7} filas={8} />
    </div>
  );
}
