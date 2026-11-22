/**
 * PURE cart merging and normalization logic — no Prisma, no Next.
 *
 * These functions are the heart of cart synchronization and can be tested in
 * isolation. They do NOT touch the database: they receive the raw items and a
 * map with the live product information (the server action resolves the source
 * of truth for stock/price/active BEFORE calling into here).
 *
 * Common rules (merging and normalizing):
 *  - A product that is NOT in the `productos` map is dropped (nonexistent).
 *  - A product with `activo === false` is dropped.
 *  - A product with `stock <= 0` is dropped (it cannot be bought).
 *  - The resulting quantities are integers and are clamped to `1..stock`.
 *  - The output order is stable: first the products of the first array
 *    (remote ones when merging / items as they arrive when normalizing), in
 *    their original order; then the new ones from the second array (local)
 *    that were not there yet.
 *
 * Key difference:
 *  - `fusionarItems`: ADDS UP the local + remote quantities per productId (login).
 *  - `normalizarItems`: does NOT add up; it takes the quantity as is and only
 *    clamps/drops (idempotent replace-all to push the client state to the DB).
 */

/** Cart item reduced to the minimum that travels between client and server. */
export type ItemCarritoPlano = {
  productId: string;
  cantidad: number;
};

/** Live product data needed to validate/clamp an item. */
export type InfoProductoCarrito = {
  id: string;
  nombre: string;
  precio: number;
  sku: string;
  stock: number;
  activo: boolean;
  imagen: string | null;
};

/** Clamps an integer to the [min, max] range. */
function clampEntero(valor: number, min: number, max: number): number {
  const entero = Math.floor(valor);
  return Math.max(min, Math.min(max, entero));
}

/**
 * Can this product be bought? (it exists in the map, is active and has stock > 0).
 * Returns the product info if so, or `null` to drop the item.
 */
function productoComprable(
  productId: string,
  productos: Map<string, InfoProductoCarrito>,
): InfoProductoCarrito | null {
  const p = productos.get(productId);
  if (!p) return null; // nonexistent
  if (!p.activo) return null; // inactive
  if (p.stock <= 0) return null; // out of stock
  return p;
}

/**
 * Merges two carts by ADDING UP quantities per productId (login case).
 *
 * @param locales  items of the local cart (the browser's localStorage).
 * @param remotos  items of the user's cart stored in the DB.
 * @param productos map of productId -> live product info.
 * @returns the merged items, dropping nonexistent/inactive/stock 0 ones and
 *          clamping each quantity to `1..stock`. Stable order: first the
 *          productId values that appeared in `remotos`, then the new ones from `locales`.
 */
export function fusionarItems(
  locales: ItemCarritoPlano[],
  remotos: ItemCarritoPlano[],
  productos: Map<string, InfoProductoCarrito>,
): ItemCarritoPlano[] {
  // Accumulates quantities per productId keeping the order of first appearance
  // (remote first, then local) for a stable output.
  const sumas = new Map<string, number>();
  const orden: string[] = [];

  const acumular = (items: ItemCarritoPlano[]): void => {
    for (const item of items) {
      const previo = sumas.get(item.productId);
      // Only counts contributions with a positive quantity; ignores garbage (<=0/NaN).
      const aporta = Number.isFinite(item.cantidad)
        ? Math.max(0, Math.floor(item.cantidad))
        : 0;
      if (previo === undefined) {
        orden.push(item.productId);
        sumas.set(item.productId, aporta);
      } else {
        sumas.set(item.productId, previo + aporta);
      }
    }
  };

  acumular(remotos);
  acumular(locales);

  const resultado: ItemCarritoPlano[] = [];
  for (const productId of orden) {
    const p = productoComprable(productId, productos);
    if (!p) continue;
    const total = sumas.get(productId) ?? 0;
    if (total <= 0) continue; // nothing to add up after ignoring invalid contributions
    resultado.push({
      productId,
      cantidad: clampEntero(total, 1, p.stock),
    });
  }

  return resultado;
}

/**
 * Normalizes a cart WITHOUT adding up (idempotent replace-all).
 *
 * Takes each item's quantity as it comes (it does not accumulate across
 * duplicates; the payload is assumed to arrive already deduplicated by the
 * validator). Drops nonexistent/inactive/stock 0 items and clamps each
 * quantity to `1..stock`. Preserves the input order.
 */
export function normalizarItems(
  items: ItemCarritoPlano[],
  productos: Map<string, InfoProductoCarrito>,
): ItemCarritoPlano[] {
  const vistos = new Set<string>();
  const resultado: ItemCarritoPlano[] = [];

  for (const item of items) {
    // If duplicates did arrive (they should not: the validator dedupes), the
    // first one is kept so as not to lose idempotency or reorder.
    if (vistos.has(item.productId)) continue;
    const p = productoComprable(item.productId, productos);
    if (!p) continue;
    const cantidad = Number.isFinite(item.cantidad)
      ? Math.floor(item.cantidad)
      : 0;
    if (cantidad <= 0) continue; // invalid quantity -> the item is dropped
    vistos.add(item.productId);
    resultado.push({
      productId: item.productId,
      cantidad: clampEntero(cantidad, 1, p.stock),
    });
  }

  return resultado;
}
