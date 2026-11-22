import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  Backpack,
  ArrowRight,
  PencilLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeroDoodles } from "@/components/storefront/hero-doodles";
import { Reveal, RevealGroup, RevealItem } from "@/components/storefront/reveal";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Papelería Nova: cuadernos, escritura, arte, mochilas y oficina elegidos con cariño. Boutique de papelería premium en Honduras. Precios en Lempiras.",
};

/* Featured categories (static for now) with a soft tint per category.
   Mixed sizes for the bento (not a uniform grid). */
const CATEGORIAS: {
  slug: string;
  nombre: string;
  detalle: string;
  bg: string;
  span: string;
}[] = [
  {
    slug: "cuadernos",
    nombre: "Cuadernos",
    detalle: "De líneas, cuadros y punteados.",
    bg: "bg-cat-cuadernos",
    span: "md:col-span-3 md:row-span-2",
  },
  {
    slug: "escritura",
    nombre: "Escritura",
    detalle: "Bolígrafos, plumas y lápices.",
    bg: "bg-cat-escritura",
    span: "md:col-span-3",
  },
  {
    slug: "arte",
    nombre: "Arte y color",
    detalle: "Marcadores, acuarelas y más.",
    bg: "bg-cat-arte",
    span: "md:col-span-3",
  },
  {
    slug: "oficina",
    nombre: "Oficina",
    detalle: "Organiza tu escritorio.",
    bg: "bg-cat-oficina",
    span: "md:col-span-2",
  },
  {
    slug: "mochilas",
    nombre: "Mochilas",
    detalle: "Listas para el regreso.",
    bg: "bg-cat-mochilas",
    span: "md:col-span-2",
  },
  {
    slug: "manualidades",
    nombre: "Manualidades",
    detalle: "Foami, papel crepé y proyectos.",
    bg: "bg-cat-manualidades",
    span: "md:col-span-2",
  },
];

const VALORES: { icon: typeof Truck; titulo: string; texto: string }[] = [
  {
    icon: Truck,
    titulo: "Envíos a todo Honduras",
    texto: "Recibe tus útiles en casa o en la oficina, rápido y seguro.",
  },
  {
    icon: ShieldCheck,
    titulo: "Pago seguro",
    texto: "Tus datos protegidos en cada compra, sin sorpresas.",
  },
  {
    icon: Backpack,
    titulo: "Regreso a clases",
    texto: "Listas armadas por grado para que no te falte nada.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ====================== ASYMMETRIC HERO ====================== */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_0.85fr] md:py-20 lg:px-12">
          {/* Left column: large title with an accented word */}
          <Reveal className="relative">
            <span className="inline-flex -rotate-2 items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-paper-2 px-3.5 py-1.5 font-display text-[0.85rem] font-medium text-ink-soft shadow-card">
              <PencilLine aria-hidden="true" className="size-4 text-accent" />
              Hecho a mano, como tu lista del cole
            </span>

            <h1 className="mt-5 font-display text-step-4 font-semibold leading-[0.98]">
              Útiles que dan
              <br />
              ganas de{" "}
              <span className="relative inline-block text-accent">
                escribir
                {/* handwritten underline */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 240 18"
                  className="absolute -bottom-2 left-0 w-full"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M3 12C58 4 120 4 180 9c20 2 40 4 57 1"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="mt-7 max-w-md text-step-1 text-ink-soft">
              Cuadernos bonitos, plumas que fluyen y todo lo que tu escritorio
              merece. Una papelería boutique, con alma de cuaderno.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChildLink href="/catalogo" variant="accent" size="lg">
                Explorar catálogo
                <ArrowRight aria-hidden="true" className="size-5" />
              </Button>
              <Link
                href="/nosotros"
                className="rounded-[var(--radius-md)] px-5 py-3 text-step-0 font-medium text-ink underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Conoce la tienda
              </Link>
            </div>
          </Reveal>

          {/* Right column: composition of motifs with a slight rotation */}
          <Reveal delay={0.12} className="relative mx-auto w-full max-w-md">
            <div className="relative aspect-square rotate-3 rounded-[var(--radius-xl)] border border-line bg-paper-2 p-6 shadow-soft">
              <HeroDoodles className="size-full" />
            </div>
            <span className="absolute -bottom-3 -left-3 -rotate-6">
              <Badge variant="nuevo">Regreso a clases</Badge>
            </span>
          </Reveal>
        </div>
      </section>

      {/* ====================== CATEGORY BENTO ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
        <Reveal className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-step-3 font-semibold">
              Compra por categoría
            </h2>
            <p className="mt-1 text-ink-soft">
              Encuentra justo lo que tu lista pide.
            </p>
          </div>
          <Link
            href="/catalogo"
            className="hidden shrink-0 items-center gap-1 rounded-[var(--radius-md)] px-3 py-2 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
          >
            Ver todo
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Reveal>

        <RevealGroup className="grid auto-rows-[150px] grid-cols-2 gap-4 md:grid-cols-6">
          {CATEGORIAS.map((cat) => (
            <RevealItem key={cat.slug} className={cat.span}>
              <Link
                href={`/catalogo?cat=${cat.slug}`}
                className={`group flex h-full flex-col justify-between rounded-[var(--radius-lg)] border border-line ${cat.bg} p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper`}
              >
                <span className="font-display text-step-2 font-semibold leading-tight text-ink">
                  {cat.nombre}
                </span>
                <span className="flex items-center justify-between text-[0.9rem] text-ink-soft">
                  {cat.detalle}
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ============== ORGANIC NOTEBOOK-STYLE DIVIDER ============== */}
      <div aria-hidden="true" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <svg
          viewBox="0 0 1200 24"
          preserveAspectRatio="none"
          className="h-6 w-full text-line-strong"
        >
          <path
            d="M0 12 Q 30 2 60 12 T 120 12 T 180 12 T 240 12 T 300 12 T 360 12 T 420 12 T 480 12 T 540 12 T 600 12 T 660 12 T 720 12 T 780 12 T 840 12 T 900 12 T 960 12 T 1020 12 T 1080 12 T 1140 12 T 1200 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* ====================== VALUE BAND ====================== */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-12">
        <RevealGroup className="grid gap-4 sm:grid-cols-3">
          {VALORES.map((v) => (
            <RevealItem key={v.titulo}>
              <div className="flex h-full items-start gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card">
                <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600">
                  <v.icon aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
                </span>
                <div>
                  <h3 className="font-display text-step-1 font-semibold">
                    {v.titulo}
                  </h3>
                  <p className="mt-1 text-[0.9rem] text-ink-soft">{v.texto}</p>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ====================== FINAL CTA ====================== */}
      <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-12">
        <Reveal className="relative overflow-hidden rounded-[var(--radius-xl)] bg-primary px-6 py-12 text-on-primary shadow-soft sm:px-12 sm:py-16">
          {/* faint notebook rules over the indigo */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 31px, currentColor 31px 32px)",
            }}
          />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <h2 className="font-display text-step-3 font-semibold text-on-primary">
                Arma tu lista escolar en minutos
              </h2>
              <p className="mt-2 text-on-primary/80">
                Te ayudamos a encontrar todo por grado y materia. Sin filas, sin
                estrés.
              </p>
            </div>
            <Button asChildLink href="/catalogo" variant="accent" size="lg">
              Empezar ahora
              <ArrowRight aria-hidden="true" className="size-5" />
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
