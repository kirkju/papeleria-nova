/**
 * ADMIN validators and rules (Zod 4) — PURE and testable.
 *
 * Two responsibilities:
 *  1) Order state machine (TRANSICIONES_PEDIDO + puedeTransicionar): the
 *     single source of truth for which status changes are valid. The
 *     `cambiarEstadoPedido` server action consults it; the UI can use it to offer
 *     only the allowed transitions, but the hard barrier is on the server.
 *  2) Filters for the admin tables (products and orders): TOTAL parsers that
 *     NEVER throw (same pattern as the catalog's `parsearFiltros`): on an
 *     invalid value they fall back to the default. The URL/searchParams is the
 *     source of truth.
 *
 * No Prisma, no Next: only types, data and Zod.
 */
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";

/** Stock threshold for flagging a product as "low stock" (inclusive). */
export const UMBRAL_STOCK_BAJO = 5;

/** Products per page in the admin tables. */
export const TAMANO_PAGINA_ADMIN = 12;

// ── Order statuses: literal tuple (for Zod enums) ────────────────────────────

/** The 5 order statuses, in flow order. */
export const ESTADOS_PEDIDO = [
  "PENDIENTE",
  "PAGADO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
] as const satisfies readonly OrderStatus[];

// ── Order state machine ──────────────────────────────────────────────────────

/**
 * VALID transitions from each status. Source of truth for the flow:
 *  - PENDIENTE -> PAGADO | CANCELADO
 *  - PAGADO    -> ENVIADO | CANCELADO
 *  - ENVIADO   -> ENTREGADO
 *  - ENTREGADO -> (final, no transitions)
 *  - CANCELADO -> (final, no transitions)
 *
 * Business note: stock is only restored when CANCELING (the server action
 * handles that, not this table). ENTREGADO and CANCELADO are terminal.
 */
export const TRANSICIONES_PEDIDO: Record<OrderStatus, OrderStatus[]> = {
  PENDIENTE: ["PAGADO", "CANCELADO"],
  PAGADO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

/**
 * Is moving from status `de` to status `a` allowed?
 * A transition to the SAME status is considered invalid (it changes nothing).
 */
export function puedeTransicionar(de: OrderStatus, a: OrderStatus): boolean {
  return TRANSICIONES_PEDIDO[de].includes(a);
}

/** Spanish labels for each status (for the UI's selects/badges). */
export const ETIQUETA_ESTADO: Record<OrderStatus, string> = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

// ── Total-parsing helpers (same pattern as the catalog) ──────────────────────

/** Takes the first value if the searchParam came repeated (array). */
function primero(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/**
 * Retries a TOTAL schema: if the first parse fails, it removes the fields that
 * Zod flagged as invalid (each falls back to its default/omission) and retries.
 * The retry can no longer fail because the remaining fields are valid.
 */
function parseTotal<T>(schema: z.ZodType<T>, crudo: Record<string, unknown>): T {
  const intento = schema.safeParse(crudo);
  if (intento.success) return intento.data;

  const limpio: Record<string, unknown> = { ...crudo };
  for (const issue of intento.error.issues) {
    const campo = issue.path[0];
    if (typeof campo === "string") delete limpio[campo];
  }

  const reintento = schema.safeParse(limpio);
  if (reintento.success) return reintento.data;

  // Safeguard (should be unreachable): absolute defaults.
  return schema.parse({});
}

/** URL text field: trim, length cap, and "" -> undefined. */
function textoFiltro(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v.length > 0 ? v : undefined))
    .optional();
}

// ── Filters for the PRODUCTS DataTable (admin) ───────────────────────────────

/** Statuses of the admin product filter. */
export const ESTADOS_PRODUCTO_FILTRO = [
  "todos",
  "activos",
  "inactivos",
  "stock-bajo",
] as const;
export type EstadoProductoFiltro = (typeof ESTADOS_PRODUCTO_FILTRO)[number];

/** Valid sort orders for the products DataTable + label for the UI. */
export const ORDENES_PRODUCTO = [
  { value: "recientes", label: "Más recientes" },
  { value: "nombre", label: "Nombre (A–Z)" },
  { value: "precio", label: "Precio (mayor)" },
  { value: "stock", label: "Stock (menor)" },
] as const;
export type OrdenProducto = (typeof ORDENES_PRODUCTO)[number]["value"];
const VALORES_ORDEN_PRODUCTO = ORDENES_PRODUCTO.map((o) => o.value) as [
  OrdenProducto,
  ...OrdenProducto[],
];

/**
 * Filter schema for the admin products table.
 * URL contract: ?q= cat= estado= orden= page=
 */
export const filtrosProductosAdminSchema = z.object({
  // Free text: searches name / sku / brand.
  q: textoFiltro(100),
  // Category slug (or id; the server decides). "" -> undefined.
  cat: textoFiltro(120),
  estado: z.enum(ESTADOS_PRODUCTO_FILTRO).default("todos"),
  orden: z.enum(VALORES_ORDEN_PRODUCTO).default("recientes"),
  page: z.coerce.number().int().min(1).default(1),
});

/** Admin product filters, already normalized (schema output). */
export type FiltrosProductosAdmin = z.infer<typeof filtrosProductosAdminSchema>;

/**
 * TOTAL parser from searchParams to `FiltrosProductosAdmin`. NEVER throws.
 */
export function parsearFiltrosProductos(
  sp: Record<string, string | string[] | undefined>,
): FiltrosProductosAdmin {
  return parseTotal(filtrosProductosAdminSchema, {
    q: primero(sp.q),
    cat: primero(sp.cat),
    estado: primero(sp.estado),
    orden: primero(sp.orden),
    page: primero(sp.page),
  });
}

// ── Filters for the ORDERS DataTable (admin) ─────────────────────────────────

/** Statuses for filtering orders: "todos" or one of the OrderStatus values. */
export const ESTADOS_PEDIDO_FILTRO = ["todos", ...ESTADOS_PEDIDO] as const;
export type EstadoPedidoFiltro = (typeof ESTADOS_PEDIDO_FILTRO)[number];

/**
 * Optional ISO date (YYYY-MM-DD or full ISO). If it does not parse to a valid
 * date it falls back to undefined (it does not break the filter). Returns the
 * original string (the server interprets it as a range bound).
 */
const fechaIsoOpcional = z
  .string()
  .trim()
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional()
  .refine(
    (v) => v === undefined || !Number.isNaN(new Date(v).getTime()),
    { message: "Fecha inválida." },
  );

/**
 * Filter schema for the admin orders table.
 * URL contract: ?q= estado= desde= hasta= page=
 *  - q: order number (contains) or customer name/email (insensitive).
 *  - desde/hasta: optional date bounds (ISO); the server builds the range.
 */
export const filtrosPedidosAdminSchema = z.object({
  q: textoFiltro(120),
  estado: z.enum(ESTADOS_PEDIDO_FILTRO).default("todos"),
  desde: fechaIsoOpcional,
  hasta: fechaIsoOpcional,
  page: z.coerce.number().int().min(1).default(1),
});

/** Admin order filters, already normalized (schema output). */
export type FiltrosPedidosAdmin = z.infer<typeof filtrosPedidosAdminSchema>;

/**
 * TOTAL parser from searchParams to `FiltrosPedidosAdmin`. NEVER throws.
 */
export function parsearFiltrosPedidos(
  sp: Record<string, string | string[] | undefined>,
): FiltrosPedidosAdmin {
  return parseTotal(filtrosPedidosAdminSchema, {
    q: primero(sp.q),
    estado: primero(sp.estado),
    desde: primero(sp.desde),
    hasta: primero(sp.hasta),
    page: primero(sp.page),
  });
}
