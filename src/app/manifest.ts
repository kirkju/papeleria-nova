import type { MetadataRoute } from "next";

/**
 * Papelería Nova Web App Manifest.
 *
 * Minimal PWA configuration so that the store is installable on mobile
 * devices and shows the right visual identity on the home screen.
 *
 * TODO (production): replace the icons entry with real images in the
 * standard sizes: 192×192 and 512×512 in PNG or WebP format, located in
 * /public/icons/. The current /favicon.ico serves as a minimal fallback.
 * Example:
 *   { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
 *   { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Papelería Nova",
    short_name: "Nova",
    description:
      "Boutique de papelería premium en Honduras. Útiles escolares y de oficina con envío a todo el país.",
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F0", // --color-paper: warm brand background
    theme_color: "#3B3B8F",      // --color-primary: brand indigo
    lang: "es",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
