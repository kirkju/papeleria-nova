import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  ARTICULOS_BLOG,
  obtenerArticulo,
  articulosRelacionados,
  type BloqueContenido,
  type ArticuloBlog,
} from "@/contenido/blog";
import { Prosa } from "@/components/storefront/prosa";
import { Button } from "@/components/ui/button";
import { SITIO, jsonLd, urlAbsoluta } from "@/lib/seo";

/* ── generateStaticParams ─────────────────────────────────────────────────── */

export function generateStaticParams(): { slug: string }[] {
  return ARTICULOS_BLOG.map((a) => ({ slug: a.slug }));
}

/* ── generateMetadata ─────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const articulo = obtenerArticulo(slug);

  if (!articulo) {
    return {
      title: "Artículo no encontrado",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: articulo.titulo,
    description: articulo.descripcion,
    alternates: { canonical: `/blog/${articulo.slug}` },
    openGraph: {
      title: articulo.titulo,
      description: articulo.descripcion,
      url: `${SITIO}/blog/${articulo.slug}`,
      type: "article",
      publishedTime: articulo.fecha,
      authors: [articulo.autor],
      images: [
        {
          url: urlAbsoluta(articulo.portada),
          alt: articulo.portadaAlt,
        },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}

/* ── Date formatting ──────────────────────────────────────────────────────── */

const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function fechaLarga(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFecha.format(d);
}

/* ── Rendering of content blocks ─────────────────────────────────────────── */

function RenderBloque({ bloque }: { bloque: BloqueContenido }) {
  switch (bloque.tipo) {
    case "h2":
      return <h2>{bloque.texto}</h2>;
    case "p":
      return <p>{bloque.texto}</p>;
    case "lista":
      return (
        <ul>
          {bloque.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
  }
}

/* ── Mini card for "Sigue leyendo" ───────────────────────────────────────── */

function TarjetaMiniArticulo({ articulo }: { articulo: ArticuloBlog }) {
  return (
    <article className="group flex gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-4 shadow-card transition-shadow hover:shadow-soft">
      <div className="size-16 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-primary-50">
        <Image
          src={articulo.portada}
          alt={articulo.portadaAlt}
          width={64}
          height={64}
          className="h-full w-full object-contain p-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-primary-600">
          {articulo.categoria}
        </span>
        <Link
          href={`/blog/${articulo.slug}`}
          className="font-display text-[0.95rem] font-semibold leading-snug text-ink decoration-2 underline-offset-2 hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-[var(--radius-sm)]"
        >
          {articulo.titulo}
        </Link>
      </div>
    </article>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default async function ArticuloBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articulo = obtenerArticulo(slug);

  if (!articulo) notFound();

  const relacionados = articulosRelacionados(articulo.slug, 2);

  /* JSON-LD: Article + BreadcrumbList */
  const schemaArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articulo.titulo,
    description: articulo.descripcion,
    datePublished: articulo.fecha,
    author: {
      "@type": "Person",
      name: articulo.autor,
    },
    publisher: {
      "@type": "Organization",
      name: "Papelería Nova",
      url: SITIO,
    },
    image: urlAbsoluta(articulo.portada),
    url: `${SITIO}/blog/${articulo.slug}`,
    inLanguage: "es",
  };

  const schemaBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: SITIO },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITIO}/blog` },
      {
        "@type": "ListItem",
        position: 3,
        name: articulo.titulo,
        item: `${SITIO}/blog/${articulo.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemaArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemaBreadcrumb) }}
      />

      {/* Accessible breadcrumb */}
      <nav aria-label="Ruta" className="mb-8">
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
              href="/blog"
              className="rounded-[var(--radius-sm)] hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Blog
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5 text-ink-faint" />
          <li aria-current="page" className="font-medium text-ink line-clamp-1">
            {articulo.titulo}
          </li>
        </ol>
      </nav>

      {/* Article header */}
      <header className="mb-8">
        <span className="inline-flex w-fit items-center rounded-[var(--radius-pill)] border border-primary/20 bg-primary-50 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide text-primary-600">
          {articulo.categoria}
        </span>
        <h1 className="mt-4 font-display text-step-3 font-semibold leading-[1.1] tracking-[-0.025em] text-ink">
          {articulo.titulo}
        </h1>
        <p className="mt-4 text-step-1 leading-relaxed text-ink-soft">
          {articulo.descripcion}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-dashed border-line-strong pt-4 text-[0.85rem] text-ink-faint">
          <span>
            Por <strong className="font-semibold text-ink-soft">{articulo.autor}</strong>
          </span>
          <time dateTime={articulo.fecha}>{fechaLarga(articulo.fecha)}</time>
        </div>
      </header>

      {/* Cover image */}
      <div className="mb-10 overflow-hidden rounded-[var(--radius-xl)] bg-primary-50">
        <Image
          src={articulo.portada}
          alt={articulo.portadaAlt}
          width={720}
          height={405}
          priority
          className="h-56 w-full object-contain p-8 sm:h-72"
        />
      </div>

      {/* Article content */}
      <Prosa as="article">
        {articulo.contenido.map((bloque, i) => (
          <RenderBloque key={i} bloque={bloque} />
        ))}
      </Prosa>

      {/* CTA to the catalog */}
      <div className="mt-14 flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-paper-2 px-6 py-10 text-center">
        <p className="font-display text-step-1 font-semibold text-ink">
          ¿Todo listo para llenar tu mochila?
        </p>
        <p className="text-step-0 text-ink-soft">
          Encuentra todos los útiles que mencionamos y muchos más en nuestro catálogo.
        </p>
        <Button asChildLink href="/catalogo" variant="accent" size="lg">
          Explorar el catálogo
        </Button>
      </div>

      {/* Keep reading */}
      {relacionados.length > 0 && (
        <section aria-labelledby="sigue-leyendo-titulo" className="mt-14">
          <h2
            id="sigue-leyendo-titulo"
            className="mb-5 font-display text-step-2 font-semibold text-ink"
          >
            Sigue leyendo
          </h2>
          <ul role="list" className="flex flex-col gap-4">
            {relacionados.map((a) => (
              <li key={a.slug}>
                <TarjetaMiniArticulo articulo={a} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
