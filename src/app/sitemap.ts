import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { urlAbsoluta } from "@/lib/seo";
import { ARTICULOS_BLOG } from "@/contenido/blog";

/**
 * Dynamic sitemap of Papelería Nova.
 *
 * It includes:
 *  - Static pages: home, catalog, informational pages.
 *  - Blog articles (lastModified = the article's publication date).
 *  - The 45 active products in the DB (slug + updatedAt).
 *
 * Canonical decisions:
 *  - Catalog routes with filters (?cat=slug) are NOT included in the sitemap
 *    since they are URLs with a query string and can produce duplicate content.
 *    The main catalog (/catalogo) is indexed.
 *  - Product pages are indexed by their clean slug: /producto/[slug].
 *  - The blog is indexed as /blog and /blog/[slug].
 */

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date().toISOString();

  /* ── Static pages ───────────────────────────────────────────────────── */
  const paginas: MetadataRoute.Sitemap = [
    {
      url: urlAbsoluta("/"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: urlAbsoluta("/catalogo"),
      lastModified: ahora,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: urlAbsoluta("/nosotros"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: urlAbsoluta("/contacto"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: urlAbsoluta("/preguntas-frecuentes"),
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: urlAbsoluta("/blog"),
      lastModified: ahora,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: urlAbsoluta("/terminos"),
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: urlAbsoluta("/privacidad"),
      lastModified: ahora,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  /* ── Blog articles (lastModified = publication date) ─────────────────── */
  const entradas: MetadataRoute.Sitemap = ARTICULOS_BLOG.map((articulo) => ({
    url: urlAbsoluta(`/blog/${articulo.slug}`),
    lastModified: articulo.fecha,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  /* ── Active products from the DB ─────────────────────────────────────── */
  let productos: MetadataRoute.Sitemap = [];

  try {
    const rows = await prisma.product.findMany({
      where: { activo: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    productos = rows.map((p) => ({
      url: urlAbsoluta(`/producto/${p.slug}`),
      lastModified: p.updatedAt.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    // If the DB is not available at build time, the sitemap is still
    // valid with the static-page entries. The error is logged on the server.
    console.error("[sitemap] Error al obtener productos:", err);
  }

  return [...paginas, ...entradas, ...productos];
}
