/**
 * Catalog validators (Zod 4) — PURE and testable.
 *
 * The URL is the catalog's source of truth (shareable and SEO-friendly).
 * This file defines the searchParams contract and a TOTAL parser that NEVER
 * throws: on any invalid value it falls back to the default. These helpers do
 * not touch the database or depend on Next.js, so they are easy to test.
 *
 * URL contract (do not change): ?q= cat= marca= min= max= disp= sort= page=
 */
import { z } from "zod";

/** Products per catalog page. */
export const TAMANO_PAGINA = 12;

/** Valid sort options + their Spanish label for the UI (selector). */
export const OPCIONES_SORT = [
  { value: "relevancia", label: "Relevancia" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "nuevos", label: "Novedades" },
] as const;

/** Union of the allowed sort values. */
export type OrdenCatalogo = (typeof OPCIONES_SORT)[number]["value"];

const VALORES_SORT = OPCIONES_SORT.map((o) => o.value) as [
  OrdenCatalogo,
  ...OrdenCatalogo[],
];

/**
 * Schema of the catalog filters. Coerces from URL strings and applies
 * defaults. Cross-field rules (min > max => swap) are resolved in a final
 * `transform` so that the result is always consistent.
 */
export const filtrosCatalogoSchema = z
  .object({
    // Free text (also searches the SKU). Trim and a 100-character cap.
    q: z
      .string()
      .trim()
      .max(100)
      .transform((v) => (v.length > 0 ? v : undefined))
      .optional(),
    // Category slug / brand: plain strings (they are trimmed).
    cat: z
      .string()
      .trim()
      .max(120)
      .transform((v) => (v.length > 0 ? v : undefined))
      .optional(),
    marca: z
      .string()
      .trim()
      .max(120)
      .transform((v) => (v.length > 0 ? v : undefined))
      .optional(),
    // Price in Lempiras: integers >= 0, coerced from string.
    min: z.coerce.number().int().min(0).optional(),
    max: z.coerce.number().int().min(0).optional(),
    // Availability: only "1" counts as true (resolved in parsearFiltros).
    disp: z.boolean().default(false),
    // Sort order, "relevancia" by default.
    sort: z.enum(VALORES_SORT).default("relevancia"),
    // 1-based page, integer >= 1, default 1.
    page: z.coerce.number().int().min(1).default(1),
  })
  // Normalizes min/max: if both exist and min > max, they are swapped.
  .transform((f) => {
    let { min, max } = f;
    if (min !== undefined && max !== undefined && min > max) {
      [min, max] = [max, min];
    }
    return { ...f, min, max };
  });

/** Catalog filters, already normalized (schema output). */
export type FiltrosCatalogo = z.infer<typeof filtrosCatalogoSchema>;

/** Takes the first value if the searchParam came repeated (array). */
function primero(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/**
 * TOTAL parser from searchParams to `FiltrosCatalogo`. NEVER throws: if a value
 * is individually invalid it is discarded and the default is used. If a parameter
 * comes repeated (array) the first one is used.
 *
 * Strategy: the full schema is tried; if it fails (e.g. min="abc"), the invalid
 * fields are cleared one by one and it retries. The second attempt can no longer
 * fail because all the remaining fields are valid or omitted.
 */
export function parsearFiltros(
  sp: Record<string, string | string[] | undefined>,
): FiltrosCatalogo {
  // disp is a boolean in the schema: only the literal "1" is considered true.
  const dispRaw = primero(sp.disp);
  const crudo = {
    q: primero(sp.q),
    cat: primero(sp.cat),
    marca: primero(sp.marca),
    min: primero(sp.min),
    max: primero(sp.max),
    disp: dispRaw === "1",
    sort: primero(sp.sort),
    page: primero(sp.page),
  };

  const intento = filtrosCatalogoSchema.safeParse(crudo);
  if (intento.success) return intento.data;

  // Second attempt: removes only the fields Zod flagged as invalid
  // (each will fall back to its default/omission) and parses again.
  const limpio: Record<string, unknown> = { ...crudo };
  for (const issue of intento.error.issues) {
    const campo = issue.path[0];
    if (typeof campo === "string") {
      delete limpio[campo];
    }
  }

  const reintento = filtrosCatalogoSchema.safeParse(limpio);
  if (reintento.success) return reintento.data;

  // Final safeguard (should be unreachable): absolute defaults.
  return filtrosCatalogoSchema.parse({});
}
