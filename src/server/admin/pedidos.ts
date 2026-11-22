"use server";

/**
 * Admin ORDER server actions — list, detail and status change.
 *
 * Golden rules of this module (non-negotiable):
 * - Authorization ALWAYS on the server:
 *     list/detail   -> "pedido:verTodos"      (VENDEDOR|ADMIN)
 *     change status -> "pedido:cambiarEstado" (VENDEDOR|ADMIN)
 *   `assertCan` throws `AuthError`. In the READS (Server Components) it is left
 *   to propagate so that the page shows a 403; in the MUTATION it is caught -> { ok }.
 * - The state machine (`puedeTransicionar`) is the single source of truth for
 *   the valid transitions; an invalid transition returns a clear error.
 * - When an order is CANCELED, the stock is RESTORED (increment by the quantity)
 *   for the items whose `productId` still exists, in the SAME transaction as the
 *   status change (all or nothing).
 * - `Decimal` does not cross to the client: rows/DTOs return `number`; dates in ISO.
 *   Explicit `select`: NEVER `passwordHash` (only the customer's name/email).
 */
import { revalidatePath } from "next/cache";
import { Prisma, type OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan, AuthError } from "@/lib/auth/guard";
import {
  TAMANO_PAGINA_ADMIN,
  TRANSICIONES_PEDIDO,
  puedeTransicionar,
  type FiltrosPedidosAdmin,
} from "@/lib/validators/admin";
import type { SnapshotDireccion } from "@/lib/validators/checkout";

// ── Output types (serializable) ───────────────────────────────────────────────

/** Row of the admin orders DataTable (serializable). */
export type PedidoFilaAdmin = {
  id: string;
  numero: string;
  cliente: { nombre: string; email: string };
  /** Sum of the units of all the lines. */
  totalItems: number;
  total: number;
  estado: OrderStatus;
  creadoEn: string; // ISO
};

export type ResultadoListaPedidos = {
  pedidos: PedidoFilaAdmin[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

/** Line of an order's detail (snapshot). */
export type PedidoItemAdmin = {
  nombre: string;
  sku: string;
  precio: number;
  cantidad: number;
  /** Line subtotal (precio * cantidad). */
  subtotalLinea: number;
  /**
   * `false` if the original product no longer exists in the catalog
   * (`OrderItem.productId` became null through `onDelete: SetNull`).
   * The snapshot is still valid; this only informs the admin.
   */
  disponible: boolean;
};

/** Full detail of an order for the admin (serializable). */
export type PedidoDetalleAdmin = {
  id: string;
  numero: string;
  estado: OrderStatus;
  creadoEn: string; // ISO
  actualizadoEn: string; // ISO
  cliente: { nombre: string; email: string };
  direccion: SnapshotDireccion;
  subtotal: number;
  envio: number;
  total: number;
  items: PedidoItemAdmin[];
  /** Valid transitions from the current status (for the UI selector). */
  transicionesValidas: OrderStatus[];
};

/** Result of changing an order's status. */
export type ResultadoCambioEstado =
  | { ok: true; estado: OrderStatus; restock: boolean }
  | { ok: false; error: string };

// ── Messages ──────────────────────────────────────────────────────────────────

const ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";
const ERROR_NO_ENCONTRADO = "No encontramos ese pedido.";

// ── WHERE of the orders DataTable ─────────────────────────────────────────────

/** Builds the WHERE of the orders DataTable from the filters. */
function construirWherePedidos(
  f: FiltrosPedidosAdmin,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (f.estado !== "todos") {
    where.estado = f.estado;
  }

  if (f.q) {
    // Order number (contains) or customer name/email (insensitive).
    where.OR = [
      { numero: { contains: f.q, mode: "insensitive" } },
      { user: { nombre: { contains: f.q, mode: "insensitive" } } },
      { user: { email: { contains: f.q, mode: "insensitive" } } },
    ];
  }

  // Date range on createdAt. `hasta` is read as inclusive of the day:
  // if only the date arrives (YYYY-MM-DD), it is extended to the end of that day.
  if (f.desde || f.hasta) {
    const createdAt: Prisma.DateTimeFilter = {};
    if (f.desde) {
      const d = new Date(f.desde);
      if (!Number.isNaN(d.getTime())) createdAt.gte = d;
    }
    if (f.hasta) {
      const h = new Date(f.hasta);
      if (!Number.isNaN(h.getTime())) {
        // Date-only (no time component) -> include the whole day.
        if (/^\d{4}-\d{2}-\d{2}$/.test(f.hasta)) {
          h.setHours(23, 59, 59, 999);
        }
        createdAt.lte = h;
      }
    }
    if (createdAt.gte !== undefined || createdAt.lte !== undefined) {
      where.createdAt = createdAt;
    }
  }

  return where;
}

// ── READ: paginated list ─────────────────────────────────────────────────────

/**
 * Paginated list of orders for the admin (12/page). Requires "pedido:verTodos".
 * Order: most recent first. `totalPaginas` is at least 1. Only the customer's
 * name/email (never passwordHash).
 *
 * Throws `AuthError` if the role falls short (the page catches it -> 403).
 */
export async function listarPedidosAdmin(
  filtros: FiltrosPedidosAdmin,
): Promise<ResultadoListaPedidos> {
  await assertCan("pedido:verTodos");

  const where = construirWherePedidos(filtros);
  const take = TAMANO_PAGINA_ADMIN;
  const skip = (filtros.page - 1) * take;

  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        numero: true,
        total: true,
        estado: true,
        createdAt: true,
        user: { select: { nombre: true, email: true } },
        items: { select: { cantidad: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / take));

  return {
    pedidos: rows.map((p) => ({
      id: p.id,
      numero: p.numero,
      cliente: { nombre: p.user.nombre, email: p.user.email },
      totalItems: p.items.reduce((acc, i) => acc + i.cantidad, 0),
      total: Number(p.total),
      estado: p.estado,
      creadoEn: p.createdAt.toISOString(),
    })),
    total,
    pagina: filtros.page,
    totalPaginas,
  };
}

/**
 * Full detail of an order by id. Requires "pedido:verTodos". Returns
 * null if it does not exist. Includes items (snapshots), address, customer
 * (name/email) and the valid transitions from the current status.
 */
export async function obtenerPedidoAdmin(
  id: string,
): Promise<PedidoDetalleAdmin | null> {
  await assertCan("pedido:verTodos");

  const p = await prisma.order.findUnique({
    where: { id },
    select: {
      id: true,
      numero: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
      subtotal: true,
      envio: true,
      total: true,
      direccion: true,
      user: { select: { nombre: true, email: true } },
      items: {
        select: {
          nombre: true,
          sku: true,
          precio: true,
          cantidad: true,
          productId: true,
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    numero: p.numero,
    estado: p.estado,
    creadoEn: p.createdAt.toISOString(),
    actualizadoEn: p.updatedAt.toISOString(),
    cliente: { nombre: p.user.nombre, email: p.user.email },
    direccion: normalizarSnapshotDireccion(p.direccion),
    subtotal: Number(p.subtotal),
    envio: Number(p.envio),
    total: Number(p.total),
    items: p.items.map((i) => ({
      nombre: i.nombre,
      sku: i.sku,
      precio: Number(i.precio),
      cantidad: i.cantidad,
      subtotalLinea: Math.round(Number(i.precio) * i.cantidad * 100) / 100,
      disponible: i.productId !== null,
    })),
    transicionesValidas: [...TRANSICIONES_PEDIDO[p.estado]],
  };
}

// ── MUTATION: change status (with restock on cancel) ─────────────────────────

/**
 * Changes an order's status. Requires "pedido:cambiarEstado".
 *
 * - Validates the transition with `puedeTransicionar` (clear error if it is
 *   invalid or if the order does not exist).
 * - If `nuevoEstado === "CANCELADO"`, it RESTORES the stock (increment by each
 *   line's quantity) of the items whose `productId` still exists, in the
 *   SAME transaction as the status update: either everything applies, or nothing.
 * - Always revalidates /admin/pedidos; /catalogo only if there was a restock (the
 *   visible stock changed).
 *
 * @returns `{ ok: true, estado, restock }` or `{ ok: false, error }`.
 */
export async function cambiarEstadoPedido(
  id: string,
  nuevoEstado: OrderStatus,
): Promise<ResultadoCambioEstado> {
  try {
    await assertCan("pedido:cambiarEstado");
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    throw error;
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.order.findUnique({
        where: { id },
        select: {
          estado: true,
          items: { select: { productId: true, cantidad: true } },
        },
      });
      if (!pedido) {
        return { tipo: "no_encontrado" as const };
      }

      if (!puedeTransicionar(pedido.estado, nuevoEstado)) {
        return {
          tipo: "transicion_invalida" as const,
          de: pedido.estado,
          a: nuevoEstado,
        };
      }

      // Update CONDITIONED on the status that was read: under Read Committed
      // isolation, two concurrent calls could both read the same status and pass
      // the validation; without this guard, a double cancellation would inflate the
      // inventory (double restock). count === 0 => another transaction won.
      const actualizado = await tx.order.updateMany({
        where: { id, estado: pedido.estado },
        data: { estado: nuevoEstado },
      });
      if (actualizado.count === 0) {
        return {
          tipo: "transicion_invalida" as const,
          de: pedido.estado,
          a: nuevoEstado,
        };
      }

      let restock = false;
      if (nuevoEstado === "CANCELADO") {
        // Restore stock ONLY for the items whose product still exists.
        // It goes AFTER the conditional update: only whoever won the
        // transition restocks (and inside the same transaction: joint rollback).
        for (const item of pedido.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.cantidad } },
            });
            restock = true;
          }
        }
      }

      return { tipo: "ok" as const, restock };
    });

    if (resultado.tipo === "no_encontrado") {
      return { ok: false, error: ERROR_NO_ENCONTRADO };
    }
    if (resultado.tipo === "transicion_invalida") {
      return {
        ok: false,
        error: mensajeTransicionInvalida(resultado.de, resultado.a),
      };
    }

    revalidatePath("/admin/pedidos");
    revalidatePath(`/admin/pedidos/${id}`);
    if (resultado.restock) revalidatePath("/catalogo");

    return { ok: true, estado: nuevoEstado, restock: resultado.restock };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: ERROR_NO_ENCONTRADO };
    }
    console.error("[admin/pedidos] cambiarEstadoPedido:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Status labels used to build the invalid-transition message. */
const ETIQUETA: Record<OrderStatus, string> = {
  PENDIENTE: "pendiente",
  PAGADO: "pagado",
  ENVIADO: "enviado",
  ENTREGADO: "entregado",
  CANCELADO: "cancelado",
};

/** Clear invalid-transition message in Spanish. */
function mensajeTransicionInvalida(de: OrderStatus, a: OrderStatus): string {
  return `No se puede pasar un pedido de “${ETIQUETA[de]}” a “${ETIQUETA[a]}”.`;
}

/**
 * Normalizes the raw `Json` of `Order.direccion` into a `SnapshotDireccion`,
 * reading field by field defensively (without propagating `any`).
 */
function normalizarSnapshotDireccion(
  raw: Prisma.JsonValue,
): SnapshotDireccion {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const txt = (v: unknown): string => (typeof v === "string" ? v : "");
  const linea2 = txt(obj.linea2);

  return {
    nombre: txt(obj.nombre),
    linea1: txt(obj.linea1),
    ...(linea2 ? { linea2 } : {}),
    ciudad: txt(obj.ciudad),
    departamento: txt(obj.departamento),
    telefono: txt(obj.telefono),
  };
}
