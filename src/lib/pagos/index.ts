/**
 * Payments layer — `ProveedorPago` interface + default MOCK implementation.
 *
 * The checkout depends ONLY on the `ProveedorPago` interface, never on a specific
 * gateway. Today a mock (`proveedorPago`) that always approves is injected; when
 * the real gateway arrives, it is enough to write another class that implements
 * the same interface and replace the `export const proveedorPago`.
 *
 * Result contract: discriminated by `aprobado` so the caller does not have to
 * guess the shape. If `aprobado === false`, the order is NOT marked as paid
 * (it stays PENDIENTE) and the reason is logged for support.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TODO(pasarela-real): integrate the production payment gateway.
 *   1. Create `class ProveedorPagoStripe implements ProveedorPago` (or the chosen
 *      provider) in this same directory (`src/lib/pagos/stripe.ts`).
 *   2. In `procesar()`:
 *        - `contra_entrega`: still a local approval (there is no online charge);
 *          return `{ aprobado: true, referencia: "COD-<numeroPedido>" }`.
 *        - `tarjeta_demo` / real card: create a PaymentIntent with `montoLempiras`
 *          (converted to the currency's smallest unit), confirm it and map the
 *          status to `ResultadoPago`. NEVER receive card data in the server
 *          action: the front end talks to the gateway (tokenization) and only a
 *          token/reference arrives here.
 *   3. Replace the line `export const proveedorPago = new ProveedorPagoMock();`
 *      with the real implementation (ideally selected through an environment
 *      variable so the mock can still be used in tests/preview).
 *   4. Handle asynchronous confirmation webhooks in `app/api/pagos/webhook`
 *      (outside this module): a payment can be approved AFTER the order is created.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Payment methods supported at checkout. */
export type MetodoPago = "contra_entrega" | "tarjeta_demo";

/**
 * Result of processing a payment. Discriminated by `aprobado`:
 *  - approved: the `referencia` identifies the transaction (for support/receipt).
 *  - declined: the `motivo` is human-readable (it can be shown or logged).
 */
export type ResultadoPago =
  | { aprobado: true; referencia: string }
  | { aprobado: false; motivo: string };

/** Data the provider needs to process a charge. */
export interface EntradaPago {
  /** Total amount to charge in Lempiras (already recalculated by the server). */
  montoLempiras: number;
  /** Method chosen by the customer (validated by the checkout). */
  metodo: MetodoPago;
  /** Order number, already generated; used for traceable references. */
  numeroPedido: string;
}

/**
 * Payment gateway interface. The checkout depends on this, not on the
 * implementation. Every gateway (mock or real) implements it.
 */
export interface ProveedorPago {
  procesar(input: EntradaPago): Promise<ResultadoPago>;
}

/**
 * Default MOCK implementation. It charges nothing real; it leaves the structure
 * ready for a real gateway:
 *  - `contra_entrega`: always approves; deterministic reference `COD-<numero>`
 *    (there is no online charge; the money is collected on delivery).
 *  - `tarjeta_demo`: simulates a gateway that ALWAYS approves, with a random
 *    reference `MOCK-<aleatorio>`. The declined case is modeled in the
 *    `ResultadoPago` type even though this mock never produces it, so that the
 *    caller already handles it and the real gateway can decline without
 *    changing the contract.
 */
class ProveedorPagoMock implements ProveedorPago {
  async procesar(input: EntradaPago): Promise<ResultadoPago> {
    if (input.metodo === "contra_entrega") {
      return { aprobado: true, referencia: `COD-${input.numeroPedido}` };
    }
    // tarjeta_demo: the mock always approves.
    const aleatorio = Math.random().toString(36).slice(2, 10).toUpperCase();
    return { aprobado: true, referencia: `MOCK-${aleatorio}` };
  }
}

/**
 * The project's active payment provider. Injected into the checkout
 * (`src/server/pedidos.ts`). Replace it with the real implementation once it
 * exists (see TODO(pasarela-real) above).
 */
export const proveedorPago: ProveedorPago = new ProveedorPagoMock();
