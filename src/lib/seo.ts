/**
 * SEO + business data: SINGLE SOURCE OF TRUTH.
 *
 * Centralizes the site's base URL, the absolute-URL helper and the business's
 * contact/identity data. The public pages (home, info pages, product pages,
 * sitemap, robots, the Organization JSON-LD, etc.) must consume this instead
 * of redefining local constants.
 *
 * IMPORTANT: the `NEGOCIO` data is FICTITIOUS, for DEMO purposes. Before going
 * to production, replace whatever is marked "[completar]" with real data and
 * set NEXT_PUBLIC_SITE_URL in the environment.
 */

/**
 * Base URL of the site (no trailing slash). Taken from the
 * `NEXT_PUBLIC_SITE_URL` environment variable; if it is not set, it falls back
 * to the demo domain.
 *
 * Production setup: set `NEXT_PUBLIC_SITE_URL` to the real domain
 * (e.g. https://www.papelerianova.hn).
 */
export const SITIO: string =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://papeleria-nova.example";

/**
 * Turns a path (or an already absolute URL) into an absolute URL relative to
 * `SITIO`. If it receives something that already starts with http(s), it returns it as is.
 *
 *   urlAbsoluta("/catalogo")            -> "https://papeleria-nova.example/catalogo"
 *   urlAbsoluta("catalogo")             -> "https://papeleria-nova.example/catalogo"
 *   urlAbsoluta("https://cdn/x.jpg")    -> "https://cdn/x.jpg"
 */
export function urlAbsoluta(ruta: string): string {
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${SITIO}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
}

/**
 * Business data (FICTITIOUS / DEMO). Use it in contact pages, the footer,
 * the Organization JSON-LD and metadata. Whatever is marked "[completar]" must
 * be replaced with real data before publishing.
 */
export const NEGOCIO = {
  nombre: "Papelería Nova",
  lema: "Útiles con alma de cuaderno.",
  email: "hola@papelerianova.hn",
  telefono: "+504 2234-5678",
  direccion: {
    calle: "Col. Palmira, Ave. República de Chile [completar]",
    ciudad: "Tegucigalpa",
    departamento: "Francisco Morazán",
    pais: "HN",
  },
  horarios: "Lun–Vie 8:00–17:00, Sáb 8:00–12:00",
  redes: {
    instagram: "https://instagram.com/[completar]",
    facebook: "https://facebook.com/[completar]",
  },
} as const;

/** Type derived from the business data (for typed consumption in the UI). */
export type Negocio = typeof NEGOCIO;

/**
 * Serializes JSON-LD structured data safely for an inline `<script>`.
 * Escapes `<` as `\u003c` so that a string value cannot close the `<script>` tag.
 *
 * Usage:
 *   dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", ... }) }}
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
