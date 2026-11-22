import type { Metadata } from "next";
import {
  AlertTriangle,
  Boxes,
  PackageCheck,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  ChartCard,
  EmptyStateAdmin,
  GraficoTopProductos,
  GraficoVentasCategoria,
  GraficoVentasDia,
  PageHeader,
  StatCard,
} from "@/components/admin";
import { DashboardPanelPedidos } from "@/components/admin/dashboard-panel-pedidos";
import { DashboardPanelStock } from "@/components/admin/dashboard-panel-stock";
import { can, getCurrentUser } from "@/lib/auth/guard";
import {
  obtenerKpis,
  obtenerKpisGlobales,
  obtenerPedidosRecientes,
  obtenerProductosStockBajo,
  obtenerTopProductos,
  obtenerVentasPorCategoria,
  obtenerVentasPorDia,
  type KpisDashboard,
  type KpisGlobales,
  type PedidoReciente,
  type ProductoStockBajo,
  type TopProducto,
  type VentaPorCategoria,
} from "@/server/admin/metricas";
import type { PuntoVentaDia } from "@/lib/admin/fechas";

/**
 * Main admin dashboard (Server Component).
 *
 * EVERY figure is computed on the SERVER from Prisma (metrics module). The hard
 * authorization is already enforced by each metrics function via `assertCan`; the
 * layout is the earlier barrier of access to the panel. Here, in addition, we read
 * the name for the greeting and `can("dashboard:completo")` only to DECIDE whether
 * we render the global metrics section (it is a UI gate, not a security one).
 *
 * Robustness: each group of queries goes in its own try/catch. If a section
 * fails, it does NOT blow up the page: an error EmptyState is shown only in that
 * section and the rest of the dashboard keeps working.
 */
export const metadata: Metadata = {
  title: "Dashboard",
};

const ERROR_SECCION = "No se pudieron cargar estas métricas. Inténtalo de nuevo.";

export default async function AdminDashboardPage() {
  const usuario = await getCurrentUser();
  const nombre = primerNombre(usuario?.name) ?? "de nuevo";
  const puedeVerGlobal = await can("dashboard:completo");

  // ── Load in independent sections (a failure does not take down the rest) ─────
  // Main KPIs.
  let kpis: KpisDashboard | null = null;
  try {
    kpis = await obtenerKpis();
  } catch {
    kpis = null;
  }

  // Charts (the three share a reasonable error section).
  let ventasDia: PuntoVentaDia[] | null = null;
  let topProductos: TopProducto[] | null = null;
  let ventasCategoria: VentaPorCategoria[] | null = null;
  let graficosError = false;
  try {
    [ventasDia, topProductos, ventasCategoria] = await Promise.all([
      obtenerVentasPorDia(30),
      obtenerTopProductos(8),
      obtenerVentasPorCategoria(),
    ]);
  } catch {
    graficosError = true;
  }

  // Table panels (recent orders + low stock).
  let pedidosRecientes: PedidoReciente[] | null = null;
  let stockBajo: ProductoStockBajo[] | null = null;
  let panelesError = false;
  try {
    [pedidosRecientes, stockBajo] = await Promise.all([
      obtenerPedidosRecientes(5),
      obtenerProductosStockBajo(8),
    ]);
  } catch {
    panelesError = true;
  }

  // Global metrics (ADMIN only). If the user cannot, it is not even attempted.
  let kpisGlobales: KpisGlobales | null = null;
  let globalesError = false;
  if (puedeVerGlobal) {
    try {
      kpisGlobales = await obtenerKpisGlobales();
    } catch {
      globalesError = true;
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titulo={`Hola, ${nombre}`}
        descripcion="Resumen del negocio: ventas, pedidos e inventario de un vistazo."
      />

      {/* ── KPIs ──────────────────────────────────────────────────────────── */}
      {kpis ? (
        <section
          aria-label="Indicadores clave"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <StatCard
            etiqueta="Ventas del mes"
            valor={kpis.ventasMes}
            formato="moneda"
            icono={<TrendingUp className="size-5" strokeWidth={1.75} />}
            tendencia={
              kpis.variacionVentas !== null
                ? {
                    valor: kpis.variacionVentas,
                    etiqueta: "vs. mes anterior",
                  }
                : undefined
            }
          />
          <StatCard
            etiqueta="Pedidos hoy"
            valor={kpis.pedidosHoy}
            formato="numero"
            icono={<Receipt className="size-5" strokeWidth={1.75} />}
          />
          <StatCard
            etiqueta="Ticket promedio"
            valor={kpis.ticketPromedio}
            formato="moneda"
            icono={<Wallet className="size-5" strokeWidth={1.75} />}
          />
          <StatCard
            etiqueta="Productos con stock bajo"
            valor={kpis.stockBajo}
            formato="numero"
            icono={<AlertTriangle className="size-5" strokeWidth={1.75} />}
            className={
              kpis.stockBajo > 0
                ? "border-amber/50 bg-amber-50/40"
                : undefined
            }
          />
        </section>
      ) : (
        <SeccionError titulo="Indicadores clave" />
      )}

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      {graficosError ? (
        <SeccionError titulo="Gráficos de ventas" />
      ) : (
        <section
          aria-label="Gráficos de ventas"
          className="grid grid-cols-1 gap-4 xl:grid-cols-3"
        >
          <ChartCard
            titulo="Ventas por día"
            descripcion="Últimos 30 días (Lempiras)"
            className="xl:col-span-3"
          >
            <GraficoVentasDia data={ventasDia ?? []} />
          </ChartCard>

          <ChartCard
            titulo="Productos más vendidos"
            descripcion="Por unidades, pedidos no cancelados"
            className="xl:col-span-2"
          >
            <GraficoTopProductos
              data={(topProductos ?? []).map((p) => ({
                nombre: p.nombre,
                cantidadVendida: p.cantidadVendida,
              }))}
            />
          </ChartCard>

          <ChartCard titulo="Ventas por categoría" descripcion="Participación">
            <GraficoVentasCategoria data={ventasCategoria ?? []} />
          </ChartCard>
        </section>
      )}

      {/* ── Panels: recent orders + low stock ─────────────────────────────── */}
      {panelesError ? (
        <SeccionError titulo="Pedidos recientes y stock bajo" />
      ) : (
        <section
          aria-label="Pedidos recientes e inventario crítico"
          className="grid grid-cols-1 gap-4 2xl:grid-cols-2"
        >
          <DashboardPanelPedidos pedidos={pedidosRecientes ?? []} />
          <DashboardPanelStock productos={stockBajo ?? []} />
        </section>
      )}

      {/* ── Global metrics (ADMIN ONLY) ───────────────────────────────────── */}
      {puedeVerGlobal ? (
        <section aria-labelledby="dashboard-metricas-globales" className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2
              id="dashboard-metricas-globales"
              className="font-display text-step-1 font-semibold text-ink"
            >
              Métricas globales
            </h2>
            <p className="text-step--1 text-ink-soft">
              Visión completa del catálogo y la base de clientes.
            </p>
          </div>
          {globalesError || !kpisGlobales ? (
            <SeccionError titulo="" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                etiqueta="Valor del inventario"
                valor={kpisGlobales.valorInventario}
                formato="moneda"
                icono={<Boxes className="size-5" strokeWidth={1.75} />}
              />
              <StatCard
                etiqueta="Productos activos"
                valor={kpisGlobales.productosActivos}
                formato="numero"
                icono={<PackageCheck className="size-5" strokeWidth={1.75} />}
              />
              <StatCard
                etiqueta="Clientes registrados"
                valor={kpisGlobales.totalClientes}
                formato="numero"
                icono={<Users className="size-5" strokeWidth={1.75} />}
              />
              <StatCard
                etiqueta="Pedidos totales"
                valor={kpisGlobales.pedidosTotales}
                formato="numero"
                icono={<Receipt className="size-5" strokeWidth={1.75} />}
              />
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}

/** First name (for a friendly greeting), or null if there is no usable name. */
function primerNombre(nombre: string | null | undefined): string | null {
  const limpio = nombre?.trim();
  if (!limpio) return null;
  return limpio.split(/\s+/)[0];
}

/** Error state of a section: the page does not blow up, it only warns here. */
function SeccionError({ titulo }: { titulo: string }) {
  return (
    <section
      aria-label={titulo || "Sección con error"}
      className="rounded-[var(--radius-lg)] border border-line bg-paper shadow-card"
    >
      <EmptyStateAdmin
        titulo="No se pudieron cargar estas métricas"
        descripcion={ERROR_SECCION}
        icono={<AlertTriangle className="size-6" strokeWidth={1.75} />}
      />
    </section>
  );
}
