/**
 * Barrel of Papelería Nova's base admin components.
 *
 * Import from here in the pages (src/app/admin/**):
 *   import { PageHeader, StatCard, DataTable, StatusBadge } from "@/components/admin";
 *
 * Server-friendly (PageHeader, StatCard, ChartCard, DataTable, TablaSkeleton,
 * StatusBadge, EmptyStateAdmin, PaginacionAdmin, navigation). Client islands:
 * AdminShell, ConfirmDialog and the charts (graficos.tsx). The AdminShell is
 * mounted by the layout; the pages do not import it.
 */
export { PageHeader } from "./page-header";
export { StatCard } from "./stat-card";
export { ChartCard } from "./chart-card";
export { StatusBadge, type EstadoPedido } from "./status-badge";
export { EmptyStateAdmin } from "./empty-state";
export { PaginacionAdmin } from "./paginacion-admin";
export { ConfirmDialog } from "./confirm-dialog";
export {
  DataTable,
  TablaSkeleton,
  type ColumnaTabla,
} from "./data-table";
export {
  GraficoVentasDia,
  GraficoTopProductos,
  GraficoVentasCategoria,
  type PuntoVentasDia,
  type PuntoTopProducto,
  type PuntoVentasCategoria,
} from "./graficos";
export {
  NAV_ADMIN,
  ETIQUETA_ROL,
  esRutaActiva,
  type ItemNav,
} from "./navegacion";
