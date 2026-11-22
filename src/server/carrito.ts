"use server";

/**
 * Server actions for the persistent cart (DB) — phase 1: synchronization.
 *
 * Hard rules of this module:
 * - ALL actions require a SESSION. Without one they return a generic
 *   "Inicia sesión" error (nothing else is leaked). The ANONYMOUS cart lives
 *   only in the client's localStorage; here it is never touched by sessionToken.
 *   TODO(invitado-multidispositivo): when guest carts need to persist across
 *   devices, use `Cart.sessionToken` (httpOnly cookie) and resolve the cartId
 *   by token when there is no userId. NOT used today.
 * - The `cartId` is ALWAYS resolved through `session.user.id` (Cart upsert by
 *   userId). The client NEVER decides whose cart it is.
 * - The price stored in CartItem is a SNAPSHOT of the product's LIVE price at
 *   sync time; the client never decides prices.
 * - EXPLICIT `select`: only public product data. Prisma `Decimal` is converted
 *   to `number` at the boundary (it is not serializable to Client Components).
 * - User-readable errors; the technical detail stays in the server logs.
 *   Other users' data and raw errors are never exposed.
 *
 * Semantics of the two write paths:
 * - `fusionarCarrito`: ADDS UP local + remote per productId (on sign-in).
 * - `sincronizarCarrito`: REPLACE-ALL without adding up (idempotent push of the
 *   client state with an active session).
 * Both replace the Cart's content in a TRANSACTION (deleteMany +
 * createMany), taking the current price as the snapshot.
 */
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/guard";
import {
  fusionarItems,
  normalizarItems,
  type InfoProductoCarrito,
  type ItemCarritoPlano,
} from "@/lib/carrito/fusion";
import { itemsCarritoSchema } from "@/lib/validators/carrito";

// ── Output types (serializable, compatible with the local store) ─────────────

/**
 * Cart item returned to the client. Compatible with the local store's `CartItem`
 * (`@/stores/cart`): there `imagen` is optional (`imagen?: string`); here it
 * is `string | null`. Both are assignable because the store treats `null` and
 * missing alike (it is mapped with `imagen ?? undefined` when hydrating the store).
 */
export type ItemCarritoSync = {
  productId: string;
  nombre: string;
  /** LIVE unit price of the product in Lempiras (snapshot at sync time). */
  precio: number;
  sku: string;
  stock: number;
  imagen: string | null;
  cantidad: number;
};

/** Uniform result of the actions that return items. */
export type ResultadoCarrito =
  | { ok: true; items: ItemCarritoSync[] }
  | { ok: false; error: string };

/** Uniform result of the actions without a payload (emptying). */
export type ResultadoCarritoVacio =
  | { ok: true }
  | { ok: false; error: string };

// ── Message constants (generic, in Spanish) ──────────────────────────────────

const ERROR_SIN_SESION = "Inicia sesión para sincronizar tu carrito.";
const ERROR_GENERICO = "No se pudo actualizar el carrito.";

// ── Public product select (never sensitive fields) ───────────────────────────

const SELECT_PRODUCTO_CARRITO = {
  id: true,
  nombre: true,
  precio: true,
  sku: true,
  stock: true,
  activo: true,
  images: {
    select: { url: true },
    orderBy: { orden: "asc" },
    take: 1,
  },
} as const;

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolves (creating it if needed) the user's Cart and returns its id.
 * The upsert by `userId` guarantees a single cart per user.
 */
async function obtenerCartIdDeUsuario(userId: string): Promise<string> {
  const cart = await prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    select: { id: true },
  });
  return cart.id;
}

/**
 * Loads the live info of a set of products into a Map keyed by id.
 * Only the needed ids are queried, with an explicit `select`.
 */
async function cargarProductos(
  ids: string[],
): Promise<Map<string, InfoProductoCarrito>> {
  const mapa = new Map<string, InfoProductoCarrito>();
  if (ids.length === 0) return mapa;

  const filas = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: SELECT_PRODUCTO_CARRITO,
  });

  for (const p of filas) {
    mapa.set(p.id, {
      id: p.id,
      nombre: p.nombre,
      precio: Number(p.precio),
      sku: p.sku,
      stock: p.stock,
      activo: p.activo,
      imagen: p.images[0]?.url ?? null,
    });
  }

  return mapa;
}

/**
 * Combines flat items (productId + cantidad) with the live product info to
 * produce the `ItemCarritoSync` objects that travel to the client. Assumes every
 * `productId` was already validated by the merge/normalization logic (they exist
 * in the map, are active and have stock). If one were missing, it is skipped to be safe.
 */
function aItemsSync(
  items: ItemCarritoPlano[],
  productos: Map<string, InfoProductoCarrito>,
): ItemCarritoSync[] {
  const salida: ItemCarritoSync[] = [];
  for (const item of items) {
    const p = productos.get(item.productId);
    if (!p) continue;
    salida.push({
      productId: p.id,
      nombre: p.nombre,
      precio: p.precio,
      sku: p.sku,
      stock: p.stock,
      imagen: p.imagen,
      cantidad: item.cantidad,
    });
  }
  return salida;
}

/**
 * Replaces the whole content of the Cart with `items` in a TRANSACTION.
 * Deletes all the previous CartItem rows and creates the new ones with the LIVE price
 * as the snapshot. If `items` is empty, it only deletes (the cart ends up empty).
 */
async function reemplazarItemsCart(
  cartId: string,
  items: ItemCarritoPlano[],
  productos: Map<string, InfoProductoCarrito>,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.cartItem.deleteMany({ where: { cartId } });

    if (items.length === 0) return;

    await tx.cartItem.createMany({
      data: items.map((item) => {
        const p = productos.get(item.productId)!;
        return {
          cartId,
          productId: item.productId,
          cantidad: item.cantidad,
          // Snapshot of the live price (Decimal accepts a number).
          precio: p.precio,
        };
      }),
    });
  });
}

/** Reads the Cart's items as flat ones (productId + cantidad), stable order. */
async function leerItemsPlanos(cartId: string): Promise<ItemCarritoPlano[]> {
  const filas = await prisma.cartItem.findMany({
    where: { cartId },
    select: { productId: true, cantidad: true },
    orderBy: { createdAt: "asc" },
  });
  return filas.map((f) => ({ productId: f.productId, cantidad: f.cantidad }));
}

// ── Public actions ────────────────────────────────────────────────────────────

/**
 * Loads the signed-in user's cart with LIVE product data.
 * - Drops items of nonexistent/inactive/out-of-stock products.
 * - Clamps each quantity to the current stock.
 * - If anything changed (drops or clamps), it PERSISTS the correction in the DB
 *   so that the stored cart reflects reality.
 */
export async function obtenerCarrito(): Promise<ResultadoCarrito> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_SIN_SESION };

    const cartId = await obtenerCartIdDeUsuario(user.id);
    const planos = await leerItemsPlanos(cartId);

    if (planos.length === 0) return { ok: true, items: [] };

    const productos = await cargarProductos(planos.map((i) => i.productId));
    // normalizarItems drops invalid items and clamps to stock (without adding up).
    const normalizados = normalizarItems(planos, productos);

    // Did anything change compared with what was stored? If so, we persist the correction.
    const cambio =
      normalizados.length !== planos.length ||
      normalizados.some((n, idx) => {
        const original = planos[idx];
        return (
          !original ||
          original.productId !== n.productId ||
          original.cantidad !== n.cantidad
        );
      });

    if (cambio) {
      await reemplazarItemsCart(cartId, normalizados, productos);
    }

    return { ok: true, items: aItemsSync(normalizados, productos) };
  } catch (error) {
    // Next's control-flow errors (dynamic bailout, redirect,
    // notFound) must propagate instead of being trapped in the generic catch.
    unstable_rethrow(error);
    console.error("[carrito] obtenerCarrito:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Merges the client's local cart with the cart stored in the DB (on sign-in).
 * ADDS UP quantities per productId, clamps to live stock and drops invalid
 * items. The result replaces the Cart in the DB (deleteMany + createMany) and
 * is returned so that it also replaces the local store.
 */
export async function fusionarCarrito(
  itemsLocales: unknown,
): Promise<ResultadoCarrito> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_SIN_SESION };

    const parsed = itemsCarritoSchema.safeParse(itemsLocales);
    if (!parsed.success) return { ok: false, error: ERROR_GENERICO };
    const locales: ItemCarritoPlano[] = parsed.data;

    const cartId = await obtenerCartIdDeUsuario(user.id);
    const remotos = await leerItemsPlanos(cartId);

    // Products involved = union of local + remote ids (no duplicates).
    const ids = Array.from(
      new Set([
        ...remotos.map((i) => i.productId),
        ...locales.map((i) => i.productId),
      ]),
    );
    const productos = await cargarProductos(ids);

    const fusionados = fusionarItems(locales, remotos, productos);

    await reemplazarItemsCart(cartId, fusionados, productos);
    revalidatePath("/carrito");

    return { ok: true, items: aItemsSync(fusionados, productos) };
  } catch (error) {
    console.error("[carrito] fusionarCarrito:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Synchronizes (REPLACE-ALL) the DB cart with the client state, with an active
 * session. It does NOT add up: it takes the quantities as they are, clamps to live
 * stock and drops invalid items. Idempotent: sending the same payload leaves the same state.
 */
export async function sincronizarCarrito(
  itemsLocales: unknown,
): Promise<ResultadoCarrito> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_SIN_SESION };

    const parsed = itemsCarritoSchema.safeParse(itemsLocales);
    if (!parsed.success) return { ok: false, error: ERROR_GENERICO };
    const locales: ItemCarritoPlano[] = parsed.data;

    const cartId = await obtenerCartIdDeUsuario(user.id);

    const productos = await cargarProductos(locales.map((i) => i.productId));
    const normalizados = normalizarItems(locales, productos);

    await reemplazarItemsCart(cartId, normalizados, productos);
    revalidatePath("/carrito");

    return { ok: true, items: aItemsSync(normalizados, productos) };
  } catch (error) {
    console.error("[carrito] sincronizarCarrito:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Empties the signed-in user's cart (deletes all its CartItem rows). The Cart itself
 * is kept (it can be filled again). Idempotent.
 */
export async function vaciarCarrito(): Promise<ResultadoCarritoVacio> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: ERROR_SIN_SESION };

    const cartId = await obtenerCartIdDeUsuario(user.id);
    await prisma.cartItem.deleteMany({ where: { cartId } });
    revalidatePath("/carrito");

    return { ok: true };
  } catch (error) {
    console.error("[carrito] vaciarCarrito:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}
