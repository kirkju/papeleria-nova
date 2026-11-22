import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ARTICULOS_BLOG, type ArticuloBlog } from "@/contenido/blog";
import { SITIO } from "@/lib/seo";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips de regreso a clases, guías de organización y comparativas de útiles escolares. Ideas prácticas para estudiantes, padres y oficinas en Honduras.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog · Papelería Nova",
    description:
      "Tips de regreso a clases, guías de organización y comparativas de útiles escolares en Honduras.",
    url: `${SITIO}/blog`,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ── Date formatting ──────────────────────────────────────────────────────── */

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

/* ── Article card ─────────────────────────────────────────────────────────── */

function TarjetaArticulo({ articulo }: { articulo: ArticuloBlog }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-line bg-paper-2 shadow-card transition-shadow duration-200 hover:shadow-soft">
      {/* Cover */}
      <Link
        href={`/blog/${articulo.slug}`}
        className="block overflow-hidden rounded-t-[var(--radius-xl)] bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={articulo.portada}
          alt={articulo.portadaAlt}
          width={480}
          height={270}
          className="h-44 w-full object-contain p-6 transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        {/* Category chip */}
        <span className="inline-flex w-fit items-center rounded-[var(--radius-pill)] border border-primary/20 bg-primary-50 px-2.5 py-0.5 text-[0.75rem] font-semibold uppercase tracking-wide text-primary-600">
          {articulo.categoria}
        </span>

        {/* Title */}
        <h2 className="font-display text-step-1 font-semibold leading-snug tracking-[-0.015em] text-ink">
          <Link
            href={`/blog/${articulo.slug}`}
            className="rounded-[var(--radius-sm)] decoration-2 underline-offset-2 hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {articulo.titulo}
          </Link>
        </h2>

        {/* Description */}
        <p className="flex-1 text-step-0 leading-relaxed text-ink-soft line-clamp-3">
          {articulo.descripcion}
        </p>

        {/* Meta: author + date */}
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-dashed border-line-strong pt-3">
          <span className="text-[0.82rem] font-medium text-ink-soft">
            {articulo.autor}
          </span>
          <time
            dateTime={articulo.fecha}
            className="text-[0.8rem] tabular-nums text-ink-faint"
          >
            {fechaCorta(articulo.fecha)}
          </time>
        </div>
      </div>
    </article>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      {/* Manual header (without EncabezadoPagina, for more flexibility in the grid) */}
      <header className="mb-10 flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-12 rounded-full bg-accent/70"
        />
        <h1 className="font-display text-step-4 font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
          Blog de Papelería Nova
        </h1>
        <p className="max-w-xl text-step-1 leading-relaxed text-ink-soft">
          Tips prácticos, guías de compra y todo lo que necesitas saber para
          sacarle el máximo a tus útiles.
        </p>
      </header>

      {/* Card grid */}
      <section aria-label="Artículos del blog">
        <ul
          role="list"
          className="grid gap-6 sm:grid-cols-2"
        >
          {ARTICULOS_BLOG.map((articulo) => (
            <li key={articulo.slug}>
              <TarjetaArticulo articulo={articulo} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
