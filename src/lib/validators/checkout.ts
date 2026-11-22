/**
 * Validator for the checkout's FORMDATA CONTRACT (Zod 4) — UI -> server boundary.
 *
 * The client ALWAYS sends only `productId` + `cantidad` per line (in `itemsJson`)
 * plus the address/payment method data. The server recalculates prices,
 * subtotal, shipping and total from the DB: this validator ONLY checks the SHAPE
 * and bounds ranges; it never trusts amounts from the client.
 *
 * The DEMO card fields do NOT exist here: they carry no `name` in the form and
 * by design NEVER travel to the server.
 *
 * Shape of the contract (FormData):
 *  - direccionModo: "guardada" | "nueva"
 *  - direccionId:   string            ("guardada" mode only, required)
 *  - nombre:        string            (the recipient; required in BOTH modes)
 *  - linea1:        string            ("nueva" mode only, required)
 *  - linea2:        string?           ("nueva" mode only, optional)
 *  - ciudad:        string            ("nueva" mode only, required)
 *  - departamento:  enum of Honduras's 18 ("nueva" mode only, required)
 *  - telefono:      string            ("nueva" mode only, required)
 *  - guardarDireccion: "1"?           (checkbox; "nueva" mode only, optional)
 *  - metodoPago:    "contra_entrega" | "tarjeta_demo"
 *  - itemsJson:     string            JSON.stringify([{ productId, cantidad }])
 */
import { z } from "zod";
import { itemsCarritoSchema } from "@/lib/validators/carrito";

/** The 18 departments of Honduras (source for the address enum). */
export const DEPARTAMENTOS_HONDURAS = [
  "Atlántida",
  "Choluteca",
  "Colón",
  "Comayagua",
  "Copán",
  "Cortés",
  "El Paraíso",
  "Francisco Morazán",
  "Gracias a Dios",
  "Intibucá",
  "Islas de la Bahía",
  "La Paz",
  "Lempira",
  "Ocotepeque",
  "Olancho",
  "Santa Bárbara",
  "Valle",
  "Yoro",
] as const;

/** Department of Honduras (literal union of the 18). */
export type DepartamentoHonduras = (typeof DEPARTAMENTOS_HONDURAS)[number];

// ── Reasonable limits for the text fields ────────────────────────────────────
const MAX_NOMBRE = 120;
const MAX_LINEA = 160;
const MAX_CIUDAD = 80;
const MAX_TELEFONO = 30;

/** Required string with trim and a length cap, with a message in Spanish. */
function textoRequerido(max: number, etiqueta: string) {
  return z
    .string({ error: `Falta ${etiqueta}.` })
    .trim()
    .min(1, `Falta ${etiqueta}.`)
    .max(max, `${etiqueta} es demasiado largo.`);
}

/** Optional text: "" is normalized to undefined after the trim. */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const metodoPagoSchema = z.enum(["contra_entrega", "tarjeta_demo"], {
  error: "Selecciona un método de pago válido.",
});

const departamentoSchema = z.enum(DEPARTAMENTOS_HONDURAS, {
  error: "Selecciona un departamento válido.",
});

// ── Branch: SAVED address (referenced by id; the server verifies it) ──────────
const direccionGuardadaSchema = z.object({
  direccionModo: z.literal("guardada"),
  // The recipient's name is ALWAYS required (also with a saved address).
  nombre: textoRequerido(MAX_NOMBRE, "el nombre de quien recibe"),
  direccionId: textoRequerido(64, "la dirección de envío"),
});

// ── Branch: NEW address (all the snapshot fields) ─────────────────────────────
const direccionNuevaSchema = z.object({
  direccionModo: z.literal("nueva"),
  nombre: textoRequerido(MAX_NOMBRE, "el nombre de quien recibe"),
  linea1: textoRequerido(MAX_LINEA, "la dirección (línea 1)"),
  linea2: textoOpcional(MAX_LINEA),
  ciudad: textoRequerido(MAX_CIUDAD, "la ciudad"),
  departamento: departamentoSchema,
  telefono: textoRequerido(MAX_TELEFONO, "el teléfono"),
  // Checkbox: the browser sends "1" if it is checked; anything else = no.
  guardarDireccion: z.literal("1").optional(),
});

/**
 * Base checkout schema: discriminated union on `direccionModo` + payment
 * method + items. `itemsJson` is parsed with a SAFE JSON.parse (invalid string =>
 * error) and then re-validated with `itemsCarritoSchema` (reused from the cart):
 * dedupe, ranges and the 100-line cap included.
 */
const checkoutSchema = z.object({
  direccion: z.discriminatedUnion("direccionModo", [
    direccionGuardadaSchema,
    direccionNuevaSchema,
  ]),
  metodoPago: metodoPagoSchema,
  items: z
    .string({ error: "Tu carrito está vacío." })
    .transform((raw, ctx) => {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "No se pudieron leer los productos del carrito.",
        });
        return z.NEVER;
      }
    })
    .pipe(itemsCarritoSchema),
});

/** Checkout data already validated and normalized (schema output). */
export type CheckoutValidado = z.infer<typeof checkoutSchema>;

/** Shape of the address snapshot stored in `Order.direccion` (Json). */
export type SnapshotDireccion = {
  nombre: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  departamento: string;
  telefono: string;
};

/**
 * Reads a FormData field as a string (or `undefined` if it is missing). FormData
 * values can be a `File`; here we only care about strings.
 */
function leerCampo(form: FormData, clave: string): string | undefined {
  const valor = form.get(clave);
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Builds the raw (pre-Zod) object from the FormData, grouping the address
 * fields under `direccion` to feed the discriminated union.
 * Only the fields relevant to the mode are included (without over-filtering:
 * Zod ignores extra keys and the server rebuilds what it needs).
 */
function aObjetoCrudo(form: FormData): unknown {
  const direccionModo = leerCampo(form, "direccionModo");

  const direccionBase =
    direccionModo === "guardada"
      ? {
          direccionModo: "guardada",
          nombre: leerCampo(form, "nombre"),
          direccionId: leerCampo(form, "direccionId"),
        }
      : {
          direccionModo,
          nombre: leerCampo(form, "nombre"),
          linea1: leerCampo(form, "linea1"),
          linea2: leerCampo(form, "linea2"),
          ciudad: leerCampo(form, "ciudad"),
          departamento: leerCampo(form, "departamento"),
          telefono: leerCampo(form, "telefono"),
          guardarDireccion: leerCampo(form, "guardarDireccion"),
        };

  return {
    direccion: direccionBase,
    metodoPago: leerCampo(form, "metodoPago"),
    items: leerCampo(form, "itemsJson"),
  };
}

/**
 * Validates the whole checkout FormData.
 *
 * @returns `{ ok: true, data }` with the validated data, or `{ ok: false, error }`
 *          with the FIRST error message in Spanish (suitable for showing to the
 *          user). The technical detail is not exposed.
 */
export function parsearCheckout(
  formData: FormData,
):
  | { ok: true; data: CheckoutValidado }
  | { ok: false; error: string } {
  const parsed = checkoutSchema.safeParse(aObjetoCrudo(formData));
  if (parsed.success) return { ok: true, data: parsed.data };

  const primero = parsed.error.issues[0];
  const error = primero?.message ?? "Revisa los datos del formulario.";
  return { ok: false, error };
}
