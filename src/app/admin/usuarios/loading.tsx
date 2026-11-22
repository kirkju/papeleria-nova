import { PageHeader, TablaSkeleton } from "@/components/admin";

/**
 * Loading state of /admin/usuarios. It reproduces the header, a placeholder for
 * the filters bar and a TablaSkeleton with the same 7 columns (user,
 * email, role, status, orders, registered, actions) to avoid layout shifts
 * while the page resolves the Prisma query on the server.
 */
export default function LoadingUsuarios() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Usuarios"
        descripcion="Gestiona los roles y el estado de las cuentas. Solo administradores."
      />
      <div
        aria-hidden="true"
        className="h-[5.5rem] rounded-[var(--radius-lg)] border border-line bg-paper shadow-card pn-shimmer"
      />
      <TablaSkeleton columnas={7} filas={12} />
    </div>
  );
}
