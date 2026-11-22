/**
 * Admin METRICS data layer (READ-ONLY, for Server Components).
 *
 * Golden rules of this module:
 * - Authorization ALWAYS on the server. The sales/inventory metrics
 *   require `dashboard:ventas` (VENDEDOR|ADMIN); the global ones require
 *   `dashboard:completo` (ADMIN ONLY). `assertCan` throws `AuthError` if the
 *   role falls short; the pages/loaders catch it to show a 403.
 * - EVERY figure is computed on the SERVER from Prisma. Nothing hardcoded.
 * - `Decimal` does NOT cross into Client Components: it is converted to `number`
 *   here. Dates are returned as ISO strings.
 * - "Sales" = orders in status PAGADO|ENVIADO|ENTREGADO (charged or being
 *   fulfilled). CANCELADO and PENDIENTE orders do NOT count as a sale.
 * - Explicit `select`: `passwordHash` and other sensitive fields are never leaked.
 *
 * It is a server-only READ module (no "use server"): it is called from Server
 * Components. It exposes no mutations.
 */
import type { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan } from "@/lib/auth/guard";
import {
  agruparVentasPorDia,
  rangoMesActual,
  rangoMesAnterior,
  rangoHoy,
  variacionPorcentual,
  type PuntoVentaDia,
} from "@/lib/admin/fechas";
import { UMBRAL_STOCK_BAJO } from "@/lib/validators/admin";

// ── Business constants ────────────────────────────────────────────────────────

/** Statuses that count as a SALE (charged or being fulfilled). */
const ESTADOS_VENTA: OrderStatus[] = ["PAGADO", "ENVIADO", "ENTREGADO"];

/** Statuses that count toward "products sold" (everything except canceled). */
const ESTADOS_NO_CANCELADOS: OrderStatus[] = [
  "PENDIENTE",
  "PAGADO",
  "ENVIADO",
  "ENTREGADO",
];

// ── Output types (serializable, no Decimal or Date) ──────────────────────────

export type KpisDashboard = {
  /** Sales of the current month (Lempiras). */
  ventasMes: number;
  /** % change in sales vs the previous month; null if the previous month was 0. */
  variacionVentas: number | null;
  /** Number of orders created TODAY. */
  pedidosHoy: number;
  /** Average ticket of the month (ventasMes / number of sale orders in the month). */
  ticketPromedio: number;
  /** Number of active products with stock <= UMBRAL_STOCK_BAJO. */
  stockBajo: number;
};

export type TopProducto = {
  nombre: string;
  sku: string;
  cantidadVendida: number;
  totalLempiras: number;
};

export type VentaPorCategoria = {
  categoria: string;
  monto: number;
};

export type PedidoReciente = {
  id: string;
  numero: string;
  cliente: string;
  total: number;
  estado: OrderStatus;
  creadoEn: string; // ISO
};

export type ProductoStockBajo = {
  id: string;
  nombre: string;
  sku: string;
  stock: number;
  categoria: string;
};

export type KpisGlobales = {
  /** Inventory value: sum(precio * stock) of active products (Lempiras). */
  valorInventario: number;
  /** Number of active products. */
  productosActivos: number;
  /** Number of users with the CLIENTE role. */
  totalClientes: number;
  /** Total number of orders (all statuses). */
  pedidosTotales: number;
};

// ── Dashboard KPIs (VENDEDOR|ADMIN) ──────────────────────────────────────────

/**
 * Main dashboard KPIs. Requires `dashboard:ventas`.
 *
 * - ventasMes / ticketPromedio: SALE orders of the current month.
 * - variacionVentas: vs the previous month (null if the previous month was 0).
 * - pedidosHoy: count of orders created today (any status).
 * - stockBajo: active products with stock <= UMBRAL.
 */
export async function obtenerKpis(): Promise<KpisDashboard> {
  await assertCan("dashboard:ventas");

  const ahora = new Date();
  const mesActual = rangoMesActual(ahora);
  const mesAnterior = rangoMesAnterior(ahora);
  const hoy = rangoHoy(ahora);

  const whereVentaMes: Prisma.OrderWhereInput = {
    estado: { in: ESTADOS_VENTA },
    createdAt: { gte: mesActual.inicio, lt: mesActual.fin },
  };
  const whereVentaMesAnterior: Prisma.OrderWhereInput = {
    estado: { in: ESTADOS_VENTA },
    createdAt: { gte: mesAnterior.inicio, lt: mesAnterior.fin },
  };

  const [aggMes, aggMesAnterior, pedidosHoy, stockBajo] = await Promise.all([
    prisma.order.aggregate({
      where: whereVentaMes,
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: whereVentaMesAnterior,
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { createdAt: { gte: hoy.inicio, lt: hoy.fin } },
    }),
    prisma.product.count({
      where: { activo: true, stock: { lte: UMBRAL_STOCK_BAJO } },
    }),
  ]);

  const ventasMes = Number(aggMes._sum.total ?? 0);
  const ventasMesAnterior = Number(aggMesAnterior._sum.total ?? 0);
  const pedidosMes = aggMes._count._all;

  const ticketPromedio =
    pedidosMes > 0 ? Math.round((ventasMes / pedidosMes) * 100) / 100 : 0;

  return {
    ventasMes,
    variacionVentas: variacionPorcentual(ventasMes, ventasMesAnterior),
    pedidosHoy,
    ticketPromedio,
    stockBajo,
  };
}

// ── Sales-per-day series (VENDEDOR|ADMIN) ────────────────────────────────────

/**
 * Continuous sales series for the last `dias` days (days without sales are
 * filled with 0). Requires `dashboard:ventas`. SALE orders only.
 */
export async function obtenerVentasPorDia(
  dias = 30,
): Promise<PuntoVentaDia[]> {
  await assertCan("dashboard:ventas");

  // Search window: from the start of the first day of the series.
  const ahora = new Date();
  const inicio = new Date(ahora);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - (dias - 1));

  const pedidos = await prisma.order.findMany({
    where: {
      estado: { in: ESTADOS_VENTA },
      createdAt: { gte: inicio },
    },
    select: { createdAt: true, total: true },
  });

  return agruparVentasPorDia(
    pedidos.map((p) => ({ creadoEn: p.createdAt, total: Number(p.total) })),
    dias,
    ahora,
  );
}

// ── Top-selling products (VENDEDOR|ADMIN) ────────────────────────────────────

/**
 * Best-selling products by quantity, in NON-canceled orders. Requires
 * `dashboard:ventas`. Aggregates by the (nombre, sku) of the OrderItem snapshot so
 * that a deactivated/deleted product still shows up under its historical name.
 */
export async function obtenerTopProductos(limite = 8): Promise<TopProducto[]> {
  await assertCan("dashboard:ventas");

  const grupos = await prisma.orderItem.groupBy({
    by: ["nombre", "sku"],
    where: { order: { estado: { in: ESTADOS_NO_CANCELADOS } } },
    _sum: { cantidad: true },
    orderBy: { _sum: { cantidad: "desc" } },
    take: limite,
  });

  // The total in Lempiras (precio * cantidad per line) does not come straight out
  // of the groupBy (it does not support expressions); it is computed with a second
  // aggregation per group. To keep that to a single query we use the raw items of
  // the top and add them up in memory (the top is small: <= `limite` keys).
  const claves = grupos.map((g) => ({ nombre: g.nombre, sku: g.sku }));
  if (claves.length === 0) return [];

  const items = await prisma.orderItem.findMany({
    where: {
      order: { estado: { in: ESTADOS_NO_CANCELADOS } },
      OR: claves,
    },
    select: { nombre: true, sku: true, precio: true, cantidad: true },
  });

  // Accumulates the total per "nombre\u0000sku" key (a separator that cannot occur in the data).
  const totalPorClave = new Map<string, number>();
  for (const it of items) {
    const clave = `${it.nombre}\u0000${it.sku}`;
    const aporte = Number(it.precio) * it.cantidad;
    totalPorClave.set(clave, (totalPorClave.get(clave) ?? 0) + aporte);
  }

  return grupos.map((g) => ({
    nombre: g.nombre,
    sku: g.sku,
    cantidadVendida: g._sum.cantidad ?? 0,
    totalLempiras:
      Math.round((totalPorClave.get(`${g.nombre}\u0000${g.sku}`) ?? 0) * 100) /
      100,
  }));
}

// ── Sales by category (VENDEDOR|ADMIN) ───────────────────────────────────────

/**
 * Sales grouped by category (Lempiras). Requires `dashboard:ventas`.
 * Joins OrderItem -> Product -> Category. Items whose `productId` became null
 * (deleted product) are grouped under "Otros". NON-canceled orders only.
 * Result sorted by amount, descending.
 */
export async function obtenerVentasPorCategoria(): Promise<
  VentaPorCategoria[]
> {
  await assertCan("dashboard:ventas");

  const items = await prisma.orderItem.findMany({
    where: { order: { estado: { in: ESTADOS_NO_CANCELADOS } } },
    select: {
      precio: true,
      cantidad: true,
      product: { select: { category: { select: { nombre: true } } } },
    },
  });

  const OTROS = "Otros";
  const porCategoria = new Map<string, number>();
  for (const it of items) {
    const categoria = it.product?.category?.nombre ?? OTROS;
    const aporte = Number(it.precio) * it.cantidad;
    porCategoria.set(categoria, (porCategoria.get(categoria) ?? 0) + aporte);
  }

  return Array.from(porCategoria.entries())
    .map(([categoria, monto]) => ({
      categoria,
      monto: Math.round(monto * 100) / 100,
    }))
    .sort((a, b) => b.monto - a.monto);
}

// ── Recent orders (VENDEDOR|ADMIN) ───────────────────────────────────────────

/**
 * Latest orders created (any status), serialized. Requires
 * `dashboard:ventas`. Includes only the customer's NAME (never passwordHash).
 */
export async function obtenerPedidosRecientes(
  limite = 5,
): Promise<PedidoReciente[]> {
  await assertCan("dashboard:ventas");

  const pedidos = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limite,
    select: {
      id: true,
      numero: true,
      total: true,
      estado: true,
      createdAt: true,
      user: { select: { nombre: true } },
    },
  });

  return pedidos.map((p) => ({
    id: p.id,
    numero: p.numero,
    cliente: p.user.nombre,
    total: Number(p.total),
    estado: p.estado,
    creadoEn: p.createdAt.toISOString(),
  }));
}

// ── Low-stock products (VENDEDOR|ADMIN) ──────────────────────────────────────

/**
 * ACTIVE products with stock <= UMBRAL, in ascending stock order (the most
 * critical first). Requires `dashboard:ventas`.
 */
export async function obtenerProductosStockBajo(
  limite = 8,
): Promise<ProductoStockBajo[]> {
  await assertCan("dashboard:ventas");

  const productos = await prisma.product.findMany({
    where: { activo: true, stock: { lte: UMBRAL_STOCK_BAJO } },
    orderBy: [{ stock: "asc" }, { nombre: "asc" }],
    take: limite,
    select: {
      id: true,
      nombre: true,
      sku: true,
      stock: true,
      category: { select: { nombre: true } },
    },
  });

  return productos.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    sku: p.sku,
    stock: p.stock,
    categoria: p.category.nombre,
  }));
}

// ── Global KPIs (ADMIN ONLY) ─────────────────────────────────────────────────

/**
 * Global business metrics. Requires `dashboard:completo` (ADMIN ONLY).
 * `valorInventario` = sum(precio * stock) of active products: since Prisma does
 * not aggregate expressions, the (precio, stock) of the active ones is fetched
 * and added up in memory.
 */
export async function obtenerKpisGlobales(): Promise<KpisGlobales> {
  await assertCan("dashboard:completo");

  const [activos, totalClientes, pedidosTotales] = await Promise.all([
    prisma.product.findMany({
      where: { activo: true },
      select: { precio: true, stock: true },
    }),
    prisma.user.count({ where: { role: "CLIENTE" } }),
    prisma.order.count(),
  ]);

  let valorInventario = 0;
  for (const p of activos) {
    valorInventario += Number(p.precio) * p.stock;
  }

  return {
    valorInventario: Math.round(valorInventario * 100) / 100,
    productosActivos: activos.length,
    totalClientes,
    pedidosTotales,
  };
}
