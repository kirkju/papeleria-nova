/**
 * Cart payload validator (Zod 4) — client -> server boundary.
 *
 * The client sends only `productId` + `cantidad`. Price, stock and
 * availability are ALWAYS resolved by the server from the DB; here only the
 * SHAPE is validated and ranges are bounded to prevent abusive payloads.
 *
 * Schema decisions:
 *  - At most 100 distinct lines per cart (anti-abuse cap).
 *  - `productId`: string of 1..64 chars (Prisma cuids fit comfortably).
 *  - `cantidad`: integer 1..999 (the real clamp to stock is done by the server).
 *  - DEDUPE by productId: if the client sends the same product several times,
 *    the quantities are ADDED UP in a `transform` BEFORE returning the array, so
 *    that the merge/normalization logic receives at most one line per
 *    product. The sum is re-clamped to the cap (999) so it does not overflow.
 */
import { z } from "zod";

/** Cap on distinct lines accepted in a single cart payload. */
export const MAX_LINEAS_CARRITO = 100;
/** Cap on units per line accepted in the payload (actual stock has the final say). */
export const MAX_CANTIDAD_LINEA = 999;

const itemCarritoSchema = z.object({
  productId: z.string().trim().min(1).max(64),
  cantidad: z.number().int().min(1).max(MAX_CANTIDAD_LINEA),
});

/**
 * Array of cart items with dedupe by productId.
 *
 * The array is validated first (shape + ranges) and then a `transform` collapses
 * duplicates by adding up quantities (preserving the order of first appearance).
 * The `MAX_LINEAS_CARRITO` limit applies to the INPUT array to bound the
 * work; after the dedupe the result can only have the same number of lines or fewer.
 */
export const itemsCarritoSchema = z
  .array(itemCarritoSchema)
  .max(MAX_LINEAS_CARRITO)
  .transform((items) => {
    const indices = new Map<string, number>();
    const deduplicados: { productId: string; cantidad: number }[] = [];

    for (const item of items) {
      const pos = indices.get(item.productId);
      if (pos === undefined) {
        indices.set(item.productId, deduplicados.length);
        deduplicados.push({ ...item });
      } else {
        const acumulado = deduplicados[pos].cantidad + item.cantidad;
        deduplicados[pos].cantidad = Math.min(acumulado, MAX_CANTIDAD_LINEA);
      }
    }

    return deduplicados;
  });

/** Cart items already validated and deduplicated (schema output). */
export type ItemsCarritoValidados = z.infer<typeof itemsCarritoSchema>;
