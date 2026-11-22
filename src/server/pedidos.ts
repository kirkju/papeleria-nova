"use server";

/**
 * ORDER server actions — checkout (create) and looking up an order.
 *
 * Golden rules of this module (non-negotiable):
 * - Authorization ALWAYS on the server. Creating an order => CLIENTE|VENDEDOR|ADMIN
 *   (guests do NOT buy). Viewing an order => the owner or whoever holds "pedido:verTodos".
 * - The SERVER recalculates EVERYTHING from the DB. The client only sends productId +
 *   cantidad; the prices, subtotal, shipping and total come from the DB.
 * - Atomic stock INSIDE the transaction: `updateMany` with a guard
 *   (active + enough stock); if `count === 0` => full rollback.
 * - Snapshots in `OrderItem` (nombre/sku/precio) and the address as a Json snapshot:
 *   the history does not change if the product or the address change later.
 * - Money with `Prisma.Decimal`, never Float.
 * - User-readable messages; the technical detail only in `console.error`.
 * - The existence of other users' orders is not leaked: same generic error.
 */
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  requireRole,
  getCurrentUser,
  can,
  AuthError,
} from "@/lib/auth/guard";
import {
  parsearCheckout,
  type CheckoutValidado,
  type SnapshotDireccion,
} from "@/lib/validators/checkout";
import {
  calcularEnvio,
  generarNumeroPedido,
} from "@/lib/pedidos/calculos";
import { proveedorPago, type MetodoPago } from "@/lib/pagos";
import type { OrderStatus } from "@prisma/client";

// ── Results ───────────────────────────────────────────────────────────────────

export type ResultadoCrearPedido =
  | { ok: true; numero: string }
  | { ok: false; error: string };

/** Line of an order as returned to the client (snapshots). */
export type PedidoItemDTO = {
  nombre: string;
  sku: string;
  /** Unit price in Lempiras (snapshot at the time of the order). */
  precio: number;
  cantidad: number;
};

/** Serializable order for the client (no Decimal or Date). */
export type PedidoDTO = {
  numero: string;
  estado: OrderStatus;
  /** Creation date in ISO 8601. */
  creadoEn: string;
  subtotal: number;
  envio: number;
  total: number;
  direccion: SnapshotDireccion;
  items: PedidoItemDTO[];
};

export type ResultadoPedido =
  | { ok: true; pedido: PedidoDTO }
  | { ok: false; error: string };

// ── Messages (in Spanish, without leaking details) ──────────────────────────

const ERROR_CARRITO_VACIO = "Tu carrito está vacío.";
const ERROR_DIRECCION = "La dirección de envío no es válida.";
const ERROR_GENERICO = "No se pudo procesar tu pedido. Inténtalo de nuevo.";
const ERROR_PEDIDO_NO_DISPONIBLE =
  "No encontramos ese pedido o no tienes acceso a él.";

/** Retries of the order number on a unique index collision. */
const MAX_INTENTOS_NUMERO = 3;

// ── Stock error: carries the product name for the message ────────────────────

/**
 * Error thrown inside the transaction when a product does not have enough
 * stock (or became inactive). It rolls back the WHOLE transaction. It carries
 * the product name to build a useful message outside the transaction.
 */
class StockInsuficienteError extends Error {
  constructor(readonly nombreProducto: string) {
    super(`Sin stock suficiente: ${nombreProducto}`);
    this.name = "StockInsuficienteError";
  }
}

/** Is it Prisma's unique index collision error (P2002)? */
function esColisionUnica(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

// ── Address helpers ──────────────────────────────────────────────────────────

/**
 * Resolves the order's address snapshot from the validated checkout.
 * - "guardada" mode: verifies that the address belongs to the session's `userId`
 *   (never someone else's address). The recipient's name ALWAYS comes
 *   from the form (it is not stored in `Address`).
 * - "nueva" mode: builds the snapshot from what was sent and, if `guardarDireccion`,
 *   persists an `Address` for the user (the default one if it is the first).
 *
 * NOTE (deliberate): the `Address` is saved OUTSIDE the order transaction, as
 * "best effort". If the order then fails (e.g. stock), the saved address is
 * kept: it is independent of the order and serves the user on the next
 * attempt.
 *
 * @returns the snapshot ready for `Order.direccion`, or `null` if the saved
 *          address does not exist / is not the user's.
 */
async function resolverDireccion(
  userId: string,
  data: CheckoutValidado,
): Promise<SnapshotDireccion | null> {
  const dir = data.direccion;

  if (dir.direccionModo === "guardada") {
    const guardada = await prisma.address.findFirst({
      where: { id: dir.direccionId, userId },
      select: {
        linea1: true,
        linea2: true,
        ciudad: true,
        departamento: true,
        telefono: true,
      },
    });
    if (!guardada) return null; // nonexistent or another user's

    return {
      nombre: dir.nombre,
      linea1: guardada.linea1,
      ...(guardada.linea2 ? { linea2: guardada.linea2 } : {}),
      ciudad: guardada.ciudad,
      departamento: guardada.departamento,
      telefono: guardada.telefono,
    };
  }

  // "nueva" mode: snapshot straight from the form.
  const snapshot: SnapshotDireccion = {
    nombre: dir.nombre,
    linea1: dir.linea1,
    ...(dir.linea2 ? { linea2: dir.linea2 } : {}),
    ciudad: dir.ciudad,
    departamento: dir.departamento,
    telefono: dir.telefono,
  };

  if (dir.guardarDireccion === "1") {
    // If it is the user's FIRST address, mark it as the default.
    const cuantas = await prisma.address.count({ where: { userId } });
    await prisma.address.create({
      data: {
        userId,
        linea1: dir.linea1,
        linea2: dir.linea2 ?? null,
        ciudad: dir.ciudad,
        departamento: dir.departamento,
        telefono: dir.telefono,
        esPredeterminada: cuantas === 0,
      },
    });
  }

  return snapshot;
}

// ── Action: create an order (checkout) ───────────────────────────────────────

/**
 * Creates an order from the checkout FormData.
 *
 * Flow:
 *  a) Authorizes (CLIENTE|VENDEDOR|ADMIN).
 *  b) Validates the FormData (checkout contract). Empty cart => error.
 *  c) Resolves the address (a saved one verified against the user, or a new one).
 *  d) TRANSACTION: decrements stock atomically, builds snapshots, recalculates
 *     subtotal/shipping/total from the DB, creates the order (retrying the number
 *     on collision) and empties the user's CartItem rows.
 *  e) Processes the payment (mock); tarjeta_demo approved => status PAGADO.
 *  f) Revalidates the affected routes.
 *
 * @returns `{ ok: true, numero }` with the order number, or `{ ok: false, error }`.
 */
export async function crearPedido(
  formData: FormData,
): Promise<ResultadoCrearPedido> {
  // a) Authorization.
  let userId: string;
  try {
    const user = await requireRole(["CLIENTE", "VENDEDOR", "ADMIN"]);
    userId = user.id;
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: error.mensajePublico };
    }
    console.error("[pedidos] crearPedido auth:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  // b) Contract validation.
  const parsed = parsearCheckout(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;

  if (data.items.length === 0) {
    return { ok: false, error: ERROR_CARRITO_VACIO };
  }
  const metodo: MetodoPago = data.metodoPago;

  // c) Address (verified / built).
  let direccion: SnapshotDireccion | null;
  try {
    direccion = await resolverDireccion(userId, data);
  } catch (error) {
    console.error("[pedidos] resolverDireccion:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
  if (!direccion) return { ok: false, error: ERROR_DIRECCION };

  // Json snapshot of the address, typed without escape-hatch casts.
  const direccionJson: Prisma.InputJsonObject = {
    nombre: direccion.nombre,
    linea1: direccion.linea1,
    ...(direccion.linea2 ? { linea2: direccion.linea2 } : {}),
    ciudad: direccion.ciudad,
    departamento: direccion.departamento,
    telefono: direccion.telefono,
  };

  // d) Transaction: atomic stock + snapshots + order + emptying the cart.
  //
  // The RETRY on a number collision (P2002) wraps the WHOLE
  // transaction, not the inner create: in PostgreSQL, an error inside an
  // interactive transaction leaves it aborted (25P02) and no later
  // command can run, so retrying "from the inside" would never
  // work. Each attempt is a new transaction: the rollback of the
  // failed attempt reverts stock and cart, and the next one applies
  // everything again with another candidate number.
  const ejecutarTransaccion = (candidato: string) =>
    prisma.$transaction(async (tx) => {
      // Load the LIVE prices/names of the ordered products (never from the client).
      const ids = data.items.map((i) => i.productId);
      const productos = await tx.product.findMany({
        where: { id: { in: ids } },
        select: { id: true, nombre: true, sku: true, precio: true },
      });
      const porId = new Map(productos.map((p) => [p.id, p]));

      let subtotal = new Prisma.Decimal(0);
      const lineas: {
        productId: string;
        nombre: string;
        sku: string;
        precio: Prisma.Decimal;
        cantidad: number;
      }[] = [];

      for (const item of data.items) {
        const p = porId.get(item.productId);
        if (!p) {
          // Product nonexistent or no longer available.
          throw new StockInsuficienteError("un producto de tu carrito");
        }

        // Atomic stock guard: it only decrements if the product is active and has enough.
        const res = await tx.product.updateMany({
          where: {
            id: item.productId,
            activo: true,
            stock: { gte: item.cantidad },
          },
          data: { stock: { decrement: item.cantidad } },
        });
        if (res.count === 0) {
          // Full rollback. The name comes from the product loaded above.
          throw new StockInsuficienteError(p.nombre);
        }

        subtotal = subtotal.add(p.precio.mul(item.cantidad));
        lineas.push({
          productId: p.id,
          nombre: p.nombre,
          sku: p.sku,
          precio: p.precio,
          cantidad: item.cantidad,
        });
      }

      const envio = new Prisma.Decimal(calcularEnvio(subtotal.toNumber()));
      const total = subtotal.add(envio);

      const creado = await tx.order.create({
        data: {
          numero: candidato,
          userId,
          estado: "PENDIENTE",
          subtotal,
          envio,
          total,
          direccion: direccionJson,
          items: {
            create: lineas.map((l) => ({
              productId: l.productId,
              nombre: l.nombre,
              sku: l.sku,
              precio: l.precio,
              cantidad: l.cantidad,
            })),
          },
        },
        select: { numero: true },
      });

      // Empty the user's cart INSIDE the transaction.
      const cart = await tx.cart.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return { numero: creado.numero, total };
    });

  let numero: string;
  let totalPedido: Prisma.Decimal;
  try {
    let resultado: { numero: string; total: Prisma.Decimal } | null = null;
    for (let intento = 0; intento < MAX_INTENTOS_NUMERO; intento++) {
      try {
        resultado = await ejecutarTransaccion(generarNumeroPedido());
        break;
      } catch (error) {
        // Only a collision on the Order.numero unique index warrants another attempt
        // (with a new transaction); any other error bubbles up as is.
        if (esColisionUnica(error) && intento < MAX_INTENTOS_NUMERO - 1) {
          continue;
        }
        throw error;
      }
    }
    if (!resultado) {
      // Unreachable unless the collision persists on every attempt.
      throw new Error("No se pudo generar un número de pedido único.");
    }
    numero = resultado.numero;
    totalPedido = resultado.total;
  } catch (error) {
    if (error instanceof StockInsuficienteError) {
      return {
        ok: false,
        error: `Sin stock suficiente: ${error.nombreProducto}`,
      };
    }
    console.error("[pedidos] crearPedido tx:", error);
    return { ok: false, error: ERROR_GENERICO };
  }

  // e) Payment (mock). Outside the transaction: the order already exists (PENDIENTE).
  //    The total comes from the transaction itself (Decimal): the conversion to
  //    number happens only once, at this boundary with the provider.
  try {
    const resultado = await proveedorPago.procesar({
      montoLempiras: totalPedido.toNumber(),
      metodo,
      numeroPedido: numero,
    });

    if (resultado.aprobado && metodo === "tarjeta_demo") {
      // tarjeta_demo approved => the charge is done: mark as PAGADO.
      // TODO(pasarela-real): persist the reference in an
      // Order.referenciaPago field; for now it stays in the logs for reconciliation.
      console.info(
        `[pedidos] pago aprobado pedido=${numero} referencia=${resultado.referencia}`,
      );
      try {
        await prisma.order.update({
          where: { numero },
          data: { estado: "PAGADO" },
        });
      } catch (errorUpdate) {
        // Charge approved but the status was not reflected: a single retry and, if
        // it persists, a high-severity log WITH the reference to reconcile
        // manually (with a real gateway this would be money charged and not reflected).
        try {
          await prisma.order.update({
            where: { numero },
            data: { estado: "PAGADO" },
          });
        } catch {
          console.error(
            `[pedidos] RECONCILIAR: cobro aprobado sin reflejar. pedido=${numero} referencia=${resultado.referencia}`,
            errorUpdate,
          );
        }
      }
    } else if (!resultado.aprobado) {
      // The mock never declines, but we leave the case handled for the real gateway.
      // TODO(pasarela-real): notify the user of the decline and offer a payment
      // retry. The order stays PENDIENTE (stock already decremented); decide the
      // stock expiry/release policy if the payment is not completed within X time.
      console.error(
        `[pedidos] pago rechazado pedido=${numero} motivo=${resultado.motivo}`,
      );
    }
    // contra_entrega approved => it stays PENDIENTE (charged on delivery).
  } catch (error) {
    // The order ALREADY exists; a payment failure must not delete it. It stays PENDIENTE.
    console.error("[pedidos] proceso de pago:", error);
  }

  // f) Cache revalidation.
  revalidatePath("/catalogo");
  revalidatePath("/carrito");

  return { ok: true, numero };
}

// ── Action: get an order by number ───────────────────────────────────────────

/**
 * Returns an order by its number, serialized for the client.
 *
 * Authorization: requires a session. Visible ONLY if the order belongs to the
 * session user, OR the user holds the "pedido:verTodos" permission (VENDEDOR|ADMIN).
 * If it does not exist or there is no access, it returns the SAME generic error
 * (existence is not leaked).
 *
 * @returns `{ ok: true, pedido }` or `{ ok: false, error }`.
 */
export async function obtenerPedidoPorNumero(
  numero: string,
): Promise<ResultadoPedido> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_PEDIDO_NO_DISPONIBLE };

    const pedido = await prisma.order.findUnique({
      where: { numero },
      select: {
        numero: true,
        estado: true,
        createdAt: true,
        subtotal: true,
        envio: true,
        total: true,
        direccion: true,
        userId: true,
        items: {
          select: {
            nombre: true,
            sku: true,
            precio: true,
            cantidad: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!pedido) return { ok: false, error: ERROR_PEDIDO_NO_DISPONIBLE };

    const esDueno = pedido.userId === user.id;
    const puedeVerTodos = esDueno ? false : await can("pedido:verTodos");
    if (!esDueno && !puedeVerTodos) {
      return { ok: false, error: ERROR_PEDIDO_NO_DISPONIBLE };
    }

    const dto: PedidoDTO = {
      numero: pedido.numero,
      estado: pedido.estado,
      creadoEn: pedido.createdAt.toISOString(),
      subtotal: Number(pedido.subtotal),
      envio: Number(pedido.envio),
      total: Number(pedido.total),
      direccion: normalizarSnapshotDireccion(pedido.direccion),
      items: pedido.items.map((i) => ({
        nombre: i.nombre,
        sku: i.sku,
        precio: Number(i.precio),
        cantidad: i.cantidad,
      })),
    };

    return { ok: true, pedido: dto };
  } catch (error) {
    // Next's control-flow errors (dynamic bailout, redirect,
    // notFound) must propagate instead of being trapped in the generic catch.
    unstable_rethrow(error);
    console.error("[pedidos] obtenerPedidoPorNumero:", error);
    return { ok: false, error: ERROR_PEDIDO_NO_DISPONIBLE };
  }
}

/**
 * Converts the raw `Json` of `Order.direccion` into the `SnapshotDireccion` type.
 * The order was created with this shape, so it is safe; even so we read field by
 * field defensively (without trusting the shape) so as not to propagate `any`.
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
