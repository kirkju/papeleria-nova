/**
 * Validator for the product FORMDATA CONTRACT (create/edit) — Zod 4.
 *
 * UI -> server boundary of the admin's inventory module. Validates the SHAPE and
 * bounds ranges; the server action applies authorization, uniqueness (slug/sku)
 * and persistence. Same output style as `parsearCheckout`:
 *   `{ ok: true, data } | { ok: false, error }` with the FIRST message in Spanish.
 *
 * Contract (FormData):
 *  - nombre:        string 2..120 (required)
 *  - slug:          optional kebab string -> if empty it is derived from `nombre` (toSlug)
 *  - descripcion:   string 10..2000 (required)
 *  - precio:        positive decimal string, <= 999999.99 (required)
 *  - comparePrice:  optional decimal string; if present, it MUST be > precio
 *  - sku:           string 3..40 (required)
 *  - stock:         integer >= 0 (required)
 *  - marca:         optional string (<= 80)
 *  - categoryId:    string (required)
 *  - activo:        checkbox "1"? -> boolean (default true on create; see server)
 *  - destacado:     checkbox "1"? -> boolean
 *  - imagenUrl:     optional local path "/productos/..." (or empty)
 *
 * Money is validated as a decimal STRING (not a number) so no precision is lost:
 * the server converts it to `Prisma.Decimal`. Only the format is checked here.
 */
import { z } from "zod";
import { toSlug } from "../../../prisma/datos";

// ── Limits ───────────────────────────────────────────────────────────────────
const MIN_NOMBRE = 2;
const MAX_NOMBRE = 120;
const MIN_DESCRIPCION = 10;
const MAX_DESCRIPCION = 2000;
const MIN_SKU = 3;
const MAX_SKU = 40;
const MAX_MARCA = 80;
const MAX_PRECIO = 999999.99;

/** Price regex: digits with up to 2 decimals (no thousands separator). */
const RE_DECIMAL = /^\d+(\.\d{1,2})?$/;
/** kebab-case slug regex: lowercase letters, digits and hyphens (not at the edges). */
const RE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Local image path regex: starts with "/" (e.g. /productos/foo.webp). */
const RE_RUTA_LOCAL = /^\/[\w\-./]+$/;

// ── Reusable subschemas ──────────────────────────────────────────────────────

/** Required text with trim, length range and messages in Spanish. */
function textoRequerido(min: number, max: number, etiqueta: string) {
  return z
    .string({ error: `Falta ${etiqueta}.` })
    .trim()
    .min(min, `${etiqueta} debe tener al menos ${min} caracteres.`)
    .max(max, `${etiqueta} no puede superar ${max} caracteres.`);
}

/** Price as a positive decimal string (> 0) and <= MAX_PRECIO. */
const precioSchema = z
  .string({ error: "Falta el precio." })
  .trim()
  .min(1, "Falta el precio.")
  .refine((v) => RE_DECIMAL.test(v), "El precio debe ser un número con hasta 2 decimales.")
  .refine((v) => Number(v) > 0, "El precio debe ser mayor a 0.")
  .refine((v) => Number(v) <= MAX_PRECIO, `El precio no puede superar L ${MAX_PRECIO}.`);

/** Optional comparePrice: same format as precio (the > precio rule lives in superRefine). */
const comparePriceSchema = z
  .string()
  .trim()
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional()
  .refine(
    (v) => v === undefined || RE_DECIMAL.test(v),
    "El precio de comparación debe ser un número con hasta 2 decimales.",
  )
  .refine(
    (v) => v === undefined || (Number(v) > 0 && Number(v) <= MAX_PRECIO),
    `El precio de comparación debe estar entre 0 y L ${MAX_PRECIO}.`,
  );

/** Stock: integer >= 0 (coerced from the FormData string). */
const stockSchema = z.coerce
  .number({ error: "Falta el stock." })
  .int("El stock debe ser un número entero.")
  .min(0, "El stock no puede ser negativo.");

/** Optional slug: if present, it must be valid kebab. "" -> undefined (it is derived). */
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional()
  .refine(
    (v) => v === undefined || (v.length >= 2 && v.length <= MAX_NOMBRE && RE_SLUG.test(v)),
    "El slug solo puede tener minúsculas, números y guiones.",
  );

/** Optional brand (<= 80). "" -> undefined. */
const marcaSchema = z
  .string()
  .trim()
  .max(MAX_MARCA, "La marca es demasiado larga.")
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional();

/** Optional local image URL: a path that starts with "/". "" -> undefined. */
const imagenUrlSchema = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional()
  .refine(
    (v) => v === undefined || RE_RUTA_LOCAL.test(v),
    "La imagen debe ser una ruta local que empiece con “/”.",
  );

/** Browser checkbox: "1" => true; anything else/absence => false. */
const checkboxSchema = z
  .string()
  .optional()
  .transform((v) => v === "1");

// ── Full schema ──────────────────────────────────────────────────────────────

/**
 * Base product schema. The cross-field rule (comparePrice > precio) is applied
 * in `superRefine` once both values are available, and the slug is DERIVED from
 * the name with `toSlug` when it comes empty (in the final `transform`), which
 * guarantees an always-present, kebab-valid slug in the output.
 */
export const productoSchema = z
  .object({
    nombre: textoRequerido(MIN_NOMBRE, MAX_NOMBRE, "el nombre"),
    slug: slugSchema,
    descripcion: textoRequerido(MIN_DESCRIPCION, MAX_DESCRIPCION, "la descripción"),
    precio: precioSchema,
    comparePrice: comparePriceSchema,
    sku: textoRequerido(MIN_SKU, MAX_SKU, "el SKU"),
    stock: stockSchema,
    marca: marcaSchema,
    categoryId: textoRequerido(1, 64, "la categoría"),
    activo: checkboxSchema,
    destacado: checkboxSchema,
    imagenUrl: imagenUrlSchema,
  })
  .superRefine((val, ctx) => {
    // comparePrice, if present, must be STRICTLY greater than the price
    // (it is the "price before the sale": struck through, higher than the current one).
    if (val.comparePrice !== undefined) {
      if (Number(val.comparePrice) <= Number(val.precio)) {
        ctx.addIssue({
          code: "custom",
          path: ["comparePrice"],
          message: "El precio de comparación debe ser mayor al precio actual.",
        });
      }
    }
  })
  .transform((val) => ({
    ...val,
    // Final slug: the provided one, or derived from the name. Never empty.
    slug: val.slug ?? toSlug(val.nombre),
  }));

/** Product already validated and normalized (schema output). */
export type ProductoValidado = z.infer<typeof productoSchema>;

// ── FormData reading + public parser ─────────────────────────────────────────

/** Reads a FormData field as a string (or undefined if it is not a string). */
function leerCampo(form: FormData, clave: string): string | undefined {
  const valor = form.get(clave);
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Validates a product's FormData (create or edit).
 *
 * @returns `{ ok: true, data }` with the validated/normalized data (slug
 *          always present), or `{ ok: false, error }` with the FIRST message in
 *          Spanish. The technical detail is not exposed.
 */
export function parsearProducto(
  formData: FormData,
): { ok: true; data: ProductoValidado } | { ok: false; error: string } {
  const crudo = {
    nombre: leerCampo(formData, "nombre"),
    slug: leerCampo(formData, "slug"),
    descripcion: leerCampo(formData, "descripcion"),
    precio: leerCampo(formData, "precio"),
    comparePrice: leerCampo(formData, "comparePrice"),
    sku: leerCampo(formData, "sku"),
    stock: leerCampo(formData, "stock"),
    marca: leerCampo(formData, "marca"),
    categoryId: leerCampo(formData, "categoryId"),
    activo: leerCampo(formData, "activo"),
    destacado: leerCampo(formData, "destacado"),
    imagenUrl: leerCampo(formData, "imagenUrl"),
  };

  const parsed = productoSchema.safeParse(crudo);
  if (parsed.success) return { ok: true, data: parsed.data };

  const primero = parsed.error.issues[0];
  const error = primero?.message ?? "Revisa los datos del producto.";
  return { ok: false, error };
}
