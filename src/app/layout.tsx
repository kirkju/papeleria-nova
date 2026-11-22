import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "@/styles/globals.css";
import { SITIO, NEGOCIO, jsonLd, urlAbsoluta } from "@/lib/seo";

/**
 * Root layout. Defines the fonts (display + body), the base metadata with a title
 * template and the <html>/<body> structure. It does NOT include Header/Footer (they
 * live in (public)/layout.tsx) or SessionProvider (it is wired in separately).
 */
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Papelería Nova · Útiles escolares y de oficina",
    template: "%s · Papelería Nova",
  },
  description:
    "Boutique de papelería premium en Honduras. Cuadernos, escritura, arte y oficina elegidos con cariño. Precios en Lempiras.",
  applicationName: "Papelería Nova",
  keywords: [
    "papelería",
    "útiles escolares",
    "cuadernos",
    "oficina",
    "Honduras",
    "regreso a clases",
  ],
  authors: [{ name: "Papelería Nova" }],
  metadataBase: new URL(SITIO),
};

const schemaOrganizacion = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: NEGOCIO.nombre,
  description: NEGOCIO.lema,
  url: SITIO,
  logo: urlAbsoluta("/favicon.ico"),
  email: NEGOCIO.email,
  telephone: NEGOCIO.telefono,
  address: {
    "@type": "PostalAddress",
    streetAddress: NEGOCIO.direccion.calle,
    addressLocality: NEGOCIO.direccion.ciudad,
    addressRegion: NEGOCIO.direccion.departamento,
    addressCountry: NEGOCIO.direccion.pais,
  },
  sameAs: [NEGOCIO.redes.instagram, NEGOCIO.redes.facebook],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${hanken.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schemaOrganizacion) }}
        />
        {children}
      </body>
    </html>
  );
}
