/**
 * PURE checkout calculations — no Prisma, no Next, no side effects.
 *
 * Everything here is deterministic (except `generarNumeroPedido`, which uses
 * randomness) and testable in isolation. The source of truth for amounts is the
 * SERVER: the client never decides the shipping cost or the total. These
 * functions receive the subtotal already recalculated from the DB.
 *
 * Business rules (fixed for the whole project):
 *  - Free shipping if the subtotal is STRICTLY greater than `ENVIO_GRATIS_DESDE`
 *    (1500 L). That is: exactly 1500.00 still pays shipping; 1500.01 no longer does.
 *  - Flat shipping cost when it is not free: `COSTO_ENVIO` (80 L).
 *  - Order number: "PN-<year>-<6 uppercase alphanumerics, no ambiguous ones>".
 */

/** Subtotal threshold (Lempiras) above which shipping is free. */
export const ENVIO_GRATIS_DESDE = 1500;

/** Flat shipping cost (Lempiras) when the subtotal does not reach the threshold. */
export const COSTO_ENVIO = 80;

/**
 * Computes the shipping cost in Lempiras from the subtotal.
 *
 * Shipping is free if `subtotal > ENVIO_GRATIS_DESDE` (STRICTLY greater-than
 * comparison): a subtotal of exactly 1500.00 still pays `COSTO_ENVIO`; from
 * 1500.01 on, shipping is 0.
 *
 * @param subtotal Subtotal of the products in Lempiras (already recalculated on
 *                 the server from the DB).
 * @returns `0` if shipping is free, or `COSTO_ENVIO` otherwise.
 */
export function calcularEnvio(subtotal: number): number {
  return subtotal > ENVIO_GRATIS_DESDE ? 0 : COSTO_ENVIO;
}

/**
 * Rounds an amount to 2 decimals, avoiding the typical floating-point errors
 * (e.g. `0.1 + 0.2`). Useful when working with `number` before crossing over to
 * `Prisma.Decimal`. When the order is created the amounts travel as `Decimal`,
 * but this helper stays available for views/auxiliary calculations.
 *
 * @param valor Amount in Lempiras.
 * @returns The same amount after rounding to cents (2 decimals).
 */
export function redondear2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Alphabet for the order number suffix: digits and uppercase letters
 * EXCLUDING the visually ambiguous characters (0/O and 1/I). That way a human
 * can dictate or type the number without getting confused.
 */
const ALFABETO_PEDIDO = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0 O 1 I

/** Number of characters in the random suffix of the order number. */
const LONGITUD_SUFIJO = 6;

/**
 * Generates an order number in the format `PN-<currentYear>-<6 alphanum>`.
 *
 * Example: `PN-2026-7KQ4MT`. The suffix uses `ALFABETO_PEDIDO` (no 0/O/1/I) to
 * avoid ambiguity when reading it. It does NOT guarantee uniqueness by itself:
 * uniqueness is ensured by the `@unique` index on `Order.numero` plus the retry
 * on collision (P2002) in the `crearPedido` server action.
 *
 * @returns A candidate order number (string).
 */
export function generarNumeroPedido(): string {
  const anio = new Date().getFullYear();
  // Web Crypto (available in Node 18+ and browsers; client components also
  // import this module, which is why node:crypto is NOT used). The alphabet
  // has exactly 32 characters and 256 % 32 === 0, so the modulo over
  // random bytes is perfectly uniform (no bias).
  const bytes = new Uint8Array(LONGITUD_SUFIJO);
  crypto.getRandomValues(bytes);
  let sufijo = "";
  for (let i = 0; i < LONGITUD_SUFIJO; i++) {
    sufijo += ALFABETO_PEDIDO[bytes[i] % ALFABETO_PEDIDO.length];
  }
  return `PN-${anio}-${sufijo}`;
}
