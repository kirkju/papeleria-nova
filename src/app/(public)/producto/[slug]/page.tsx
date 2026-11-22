import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Star,
} from "lucide-react";
import {
  obtenerProductoPorSlug,
  obtenerRelacionados,
  type ProductoFicha,
} from "@/server/catalogo";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/storefront/product-card";
import { AgregarAlCarritoBoton } from "@/components/storefront/agregar-carrito-boton";
import { GaleriaProducto } from "@/components/storefront/galeria-producto";
import { formatearLempiras, cn } from "@/lib/utils";
import { SITIO, urlAbsoluta, jsonLd } from "@/lib/seo";

/** Explicit slug → background class map (Tailwind needs literal classes). */
const FONDO_CAT: Record<string, string> = {
  escritura: "bg-cat-escritura",
  cuadernos: "bg-cat-cuadernos",
  arte: "bg-cat-arte",
  oficina: "bg-cat-oficina",
  mochilas: "bg-cat-mochilas",
  manualidades: "bg-cat-manualidades",
  tecnologia: "bg-cat-tecnologia",
  geometria: "bg-cat-geometria",
};

function fondoCategoria(slug: string): string {
  return FONDO_CAT[slug] ?? "bg-paper-3";
}

/** Formats an ISO date as DD/MM/YYYY with the es-HN locale. */
const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});
function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFecha.format(d);
}

/* ── Dynamic metadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);

  if (!producto) {
    return {
      title: "Producto no encontrado",
      description: "El producto que buscas no está disponible en Papelería Nova.",
      robots: { index: false, follow: true },
    };
  }

  const descripcionCorta = producto.descripcion.slice(0, 155).trim();
  const canonical = `/producto/${producto.slug}`;
  const imagen = producto.imagen?.url
    ? urlAbsoluta(producto.imagen.url)
    : `${SITIO}/productos/placeholder.svg`;

  return {
    title: producto.nombre,
    description:
      descripcionCorta ||
      `${producto.nombre} en Papelería Nova. Envío a todo Honduras. Precio en Lempiras.`,
    alternates: { canonical },
    openGraph: {
      title: `${producto.nombre} · Papelería Nova`,
      description: descripcionCorta || `${producto.nombre} · Papelería Nova`,
      url: `${SITIO}${canonical}`,
      type: "website",
      images: [{ url: imagen, alt: producto.nombre }],
    },
    twitter: { card: "summary_large_image" },
  };
}

/* ── JSON-LD (structured data) ──────────────────────────────────────────────── */

function construirJsonLd(producto: ProductoFicha) {
  const url = `${SITIO}/producto/${producto.slug}`;
  const imagenes =
    producto.imagenes.length > 0
      ? producto.imagenes.map((img) => urlAbsoluta(img.url))
      : [`${SITIO}/productos/placeholder.svg`];

  const disponibilidad =
    producto.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const product: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: producto.nombre,
    description: producto.descripcion,
    image: imagenes,
    sku: producto.sku,
    url,
    ...(producto.marca ? { brand: { "@type": "Brand", name: producto.marca } } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "HNL",
      price: producto.precio.toFixed(2),
      availability: disponibilidad,
      url,
    },
  };

  if (producto.rating) {
    product.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: producto.rating.promedio.toFixed(1),
      reviewCount: producto.rating.total,
      bestRating: "5",
      worstRating: "1",
    };
  }

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO },
      {
        "@type": "ListItem",
        position: 2,
        name: "Catálogo",
        item: `${SITIO}/catalogo`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: producto.categoria.nombre,
        item: `${SITIO}/catalogo?cat=${producto.categoria.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: producto.nombre,
        item: url,
      },
    ],
  };

  return { product, breadcrumb };
}

// Safe JSON-LD serialization: jsonLd() from @/lib/seo (single source).

/* ── Rating stars (server) ──────────────────────────────────────────────────── */

function Estrellas({
  valor,
  total,
  size = "size-4",
}: {
  valor: number;
  total?: number;
  size?: string;
}) {
  const etiqueta =
    total !== undefined
      ? `${valor} de 5, ${total} ${total === 1 ? "reseña" : "reseñas"}`
      : `${valor} de 5`;
  return (
    <span
      role="img"
      aria-label={etiqueta}
      className="inline-flex items-center gap-0.5"
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const lleno = i + 1 <= Math.round(valor);
        return (
          <Star
            key={i}
            aria-hidden="true"
            className={cn(size, lleno ? "text-amber" : "text-line-strong")}
            fill={lleno ? "currentColor" : "none"}
            strokeWidth={1.75}
          />
        );
      })}
    </span>
  );
}

/* ── Trust band ─────────────────────────────────────────────────────────────── */

const CONFIANZA: { icon: typeof Truck; titulo: string; texto: string }[] = [
  {
    icon: Truck,
    titulo: "Envíos a todo Honduras",
    texto: "Recíbelo en casa o en la oficina.",
  },
  {
    icon: ShieldCheck,
    titulo: "Pago seguro",
    texto: "Tus datos protegidos en cada compra.",
  },
  {
    icon: RotateCcw,
    titulo: "Cambios fáciles",
    texto: "¿Algo no encajó? Te ayudamos.",
  },
];

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default async function ProductoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const producto = await obtenerProductoPorSlug(slug);

  if (!producto) notFound();

  const relacionados = await obtenerRelacionados(
    producto.categoria.slug,
    producto.id,
  );

  const enOferta =
    producto.comparePrice !== null && producto.comparePrice > producto.precio;
  const ahorro = enOferta ? (producto.comparePrice as number) - producto.precio : 0;
  const agotado = producto.stock <= 0;
  const pocas = producto.stock > 0 && producto.stock <= 5;
  const fondo = fondoCategoria(producto.categoria.slug);

  const { product, breadcrumb } = construirJsonLd(producto);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-12 lg:py-10">
      {/* JSON-LD: Product (+ AggregateRating) and BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumb) }}
      />

      {/* Accessible breadcrumb */}
      <nav aria-label="Ruta" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-[0.85rem] text-ink-soft">
          <li>
            <Link
              href="/"
              className="rounded-[var(--radius-sm)] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Inicio
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-faint" />
          <li>
            <Link
              href="/catalogo"
              className="rounded-[var(--radius-sm)] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Catálogo
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-faint" />
          <li>
            <Link
              href={`/catalogo?cat=${producto.categoria.slug}`}
              className="rounded-[var(--radius-sm)] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {producto.categoria.nombre}
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-faint" />
          <li aria-current="page" className="font-medium text-ink">
            <span className="line-clamp-1 max-w-[16rem] sm:max-w-none">
              {producto.nombre}
            </span>
          </li>
        </ol>
      </nav>

      {/* Gallery + info */}
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <GaleriaProducto
          imagenes={producto.imagenes}
          nombre={producto.nombre}
          fondo={fondo}
        />

        <div className="flex flex-col gap-5">
          {/* Category */}
          <Link
            href={`/catalogo?cat=${producto.categoria.slug}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] border border-primary/25 bg-primary-50 px-3 py-1 text-[0.78rem] font-semibold uppercase tracking-wide text-primary-600 transition-colors hover:bg-primary-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {producto.categoria.nombre}
          </Link>

          {/* Name */}
          <h1 className="font-display text-step-3 font-semibold leading-tight text-ink">
            {producto.nombre}
          </h1>

          {/* Brand + rating */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {producto.marca && (
              <span className="text-[0.9rem] text-ink-soft">
                Marca:{" "}
                <span className="font-semibold text-ink">{producto.marca}</span>
              </span>
            )}
            {producto.rating && (
              <span className="inline-flex items-center gap-2">
                <Estrellas
                  valor={producto.rating.promedio}
                  total={producto.rating.total}
                />
                <span className="text-[0.85rem] text-ink-soft tabular-nums">
                  {producto.rating.promedio.toFixed(1)} ({producto.rating.total})
                </span>
              </span>
            )}
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-end gap-3">
            <span className="font-display text-step-3 font-bold leading-none text-ink">
              {formatearLempiras(producto.precio)}
            </span>
            {enOferta && producto.comparePrice !== null && (
              <>
                <span className="text-step-1 text-ink-faint line-through">
                  <span className="sr-only">antes </span>
                  {formatearLempiras(producto.comparePrice)}
                </span>
                <Badge variant="oferta">Oferta</Badge>
              </>
            )}
          </div>
          {enOferta && (
            <p className="-mt-2 text-[0.9rem] font-medium text-accent-600">
              Ahorras {formatearLempiras(ahorro)}
            </p>
          )}

          {/* Stock status */}
          <div>
            {agotado ? (
              <Badge variant="agotado">Agotado por ahora</Badge>
            ) : pocas ? (
              <Badge variant="stock-bajo">
                Pocas unidades — quedan {producto.stock}
              </Badge>
            ) : (
              <Badge variant="nuevo">Disponible</Badge>
            )}
          </div>

          {/* Action: add to cart ("ficha" variant) */}
          <AgregarAlCarritoBoton
            producto={{
              id: producto.id,
              slug: producto.slug,
              nombre: producto.nombre,
              precio: producto.precio,
              sku: producto.sku,
              stock: producto.stock,
              imagen: producto.imagen,
            }}
            variante="ficha"
          />

          {/* Description */}
          <div className="border-t border-line pt-5">
            <h2 className="sr-only">Descripción</h2>
            <p className="whitespace-pre-line text-step-0 leading-relaxed text-ink-soft">
              {producto.descripcion}
            </p>
          </div>

          {/* Discreet SKU */}
          <p className="text-[0.8rem] text-ink-faint">
            SKU: <span className="font-medium tabular-nums">{producto.sku}</span>
          </p>

          {/* Trust band */}
          <ul
            role="list"
            className="mt-1 grid gap-3 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-4 sm:grid-cols-3"
          >
            {CONFIANZA.map((c) => (
              <li key={c.titulo} className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600">
                  <c.icon
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                  />
                </span>
                <div>
                  <p className="text-[0.82rem] font-semibold leading-tight text-ink">
                    {c.titulo}
                  </p>
                  <p className="text-[0.78rem] text-ink-soft">{c.texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reviews */}
      <section aria-labelledby="resenas-titulo" className="mt-14">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h2
            id="resenas-titulo"
            className="font-display text-step-2 font-semibold text-ink"
          >
            Reseñas
          </h2>
          {producto.rating && (
            <span className="inline-flex items-center gap-2">
              <Estrellas
                valor={producto.rating.promedio}
                total={producto.rating.total}
                size="size-5"
              />
              <span className="text-[0.9rem] text-ink-soft">
                <span className="font-semibold text-ink tabular-nums">
                  {producto.rating.promedio.toFixed(1)}
                </span>{" "}
                de 5 ·{" "}
                {producto.rating.total === 1
                  ? "1 reseña"
                  : `${producto.rating.total} reseñas`}
              </span>
            </span>
          )}
        </div>

        {producto.reviews.length > 0 ? (
          <ul role="list" className="grid gap-4 sm:grid-cols-2">
            {producto.reviews.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-step-0 font-semibold text-ink">
                    {r.autor}
                  </span>
                  <time
                    dateTime={r.fecha}
                    className="text-[0.8rem] text-ink-faint tabular-nums"
                  >
                    {fechaCorta(r.fecha)}
                  </time>
                </div>
                <Estrellas valor={r.rating} />
                {r.comentario && (
                  <p className="text-[0.92rem] leading-relaxed text-ink-soft">
                    {r.comentario}
                  </p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-paper-2 px-5 py-8 text-center text-ink-soft">
            Este producto aún no tiene reseñas. ¡Sé quien estrene la primera!
          </p>
        )}
      </section>

      {/* You may also like */}
      {relacionados.length > 0 && (
        <section aria-labelledby="relacionados-titulo" className="mt-14">
          <h2
            id="relacionados-titulo"
            className="mb-6 font-display text-step-2 font-semibold text-ink"
          >
            También te puede gustar
          </h2>
          <ul
            role="list"
            className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4"
          >
            {relacionados.map((p) => (
              <li key={p.id}>
                <ProductCard producto={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
