import { PageHeader, TablaSkeleton } from "@/components/admin";

/**
 * Loading state of /admin/productos. It reproduces the header and a placeholder
 * of the DataTable (8 columns, 12 rows = a full page) while the page
 * resolves the Prisma queries on the server.
 */
export default function LoadingProductos() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Productos"
        descripcion="Gestiona el catálogo: precios, stock, estado y destacados."
      />
      <div
        aria-hidden="true"
        className="h-[5.5rem] rounded-[var(--radius-lg)] border border-line bg-paper shadow-card pn-shimmer"
      />
      <TablaSkeleton columnas={8} filas={12} />
    </div>
  );
}
