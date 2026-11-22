import type { MetadataRoute } from "next";
import { urlAbsoluta } from "@/lib/seo";

/**
 * robots.ts — Papelería Nova.
 *
 * Allows indexing the public storefront and blocks the sections that are private
 * or add no SEO value: admin, customer account, checkout and API.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/cuenta",
          "/cuenta/",
          "/checkout",
          "/checkout/",
          "/carrito",
          "/carrito/",
          "/api/",
        ],
      },
    ],
    sitemap: urlAbsoluta("/sitemap.xml"),
  };
}
