import type { Metadata } from "next";
import {
  Heart,
  Leaf,
  ShieldCheck,
  Smile,
} from "lucide-react";
import { EncabezadoPagina, Prosa } from "@/components/storefront/prosa";
import { Button } from "@/components/ui/button";
import { SITIO } from "@/lib/seo";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Conoce la historia de Papelería Nova: una boutique familiar de útiles escolares y de oficina fundada en Tegucigalpa con amor por el papel y la escritura.",
  alternates: { canonical: "/nosotros" },
  openGraph: {
    title: "Nuestra historia · Papelería Nova",
    description:
      "Conoce la historia de Papelería Nova: una boutique familiar de útiles escolares y de oficina fundada en Tegucigalpa con amor por el papel y la escritura.",
    url: `${SITIO}/nosotros`,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ── Data ─────────────────────────────────────────────────────────────────── */

const VALORES: {
  icon: typeof Heart;
  titulo: string;
  texto: string;
}[] = [
  {
    icon: Heart,
    titulo: "Pasión por el papel",
    texto:
      "Elegimos cada producto con la misma curiosidad con la que abres un cuaderno nuevo. Si no nos enamoró a nosotros, no llega al catálogo.",
  },
  {
    icon: ShieldCheck,
    titulo: "Calidad sin trampas",
    texto:
      "Trabajamos con marcas de trayectoria comprobada. Precio honesto, descripción exacta y sin letras pequeñas que te sorprendan en la caja.",
  },
  {
    icon: Leaf,
    titulo: "Compromiso con la comunidad",
    texto:
      "Priorizamos proveedores locales y productos con menor impacto ambiental. Cada compra apoya el ecosistema emprendedor hondureño.",
  },
  {
    icon: Smile,
    titulo: "Servicio de verdad",
    texto:
      "Respondemos en horario de oficina, resolvemos problemas sin papeleo excesivo y tratamos cada pedido como si fuera el nuestro.",
  },
];

const NUMEROS: { cifra: string; etiqueta: string }[] = [
  { cifra: "6+", etiqueta: "años sirviendo a Honduras" },
  { cifra: "45+", etiqueta: "productos en catálogo" },
  { cifra: "8", etiqueta: "categorías cuidadas" },
  { cifra: "4,000+", etiqueta: "pedidos entregados" },
];

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function NosotrosPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <EncabezadoPagina
        titulo="Útiles con alma de cuaderno"
        acento="alma de cuaderno"
        descripcion="Somos una boutique de papelería nacida en Tegucigalpa con una misión clara: que comprar útiles sea un placer, no una obligación."
        motivo="cuaderno"
      />

      {/* Story */}
      <section aria-labelledby="historia-titulo" className="mt-14">
        <Prosa as="div">
          <h2 id="historia-titulo">Nuestra historia</h2>
          <p>
            Papelería Nova nació en 2020 de una idea sencilla: en Honduras no
            existía un lugar donde los útiles escolares y de oficina se
            presentaran con el mismo cuidado que tienen los libros en una
            librería independiente. La fundó una familia tegucigalpense con dos
            décadas en el comercio de papelería, convencida de que el cuaderno
            correcto puede cambiar el semestre de un estudiante.
          </p>
          <p>
            Lo que empezó como un local pequeño en la Colonia Palmira se
            convirtió, ciclo tras ciclo, en la referencia de regreso a clases
            para cientos de familias, docentes y pequeñas empresas de
            Tegucigalpa. En 2023 abrimos la tienda en línea para llegar a todo
            el país, porque el norte, el sur y la Costa Norte también merecen
            acceso a buenos útiles sin tener que esperar al viaje a la capital.
          </p>
          <p>
            Hoy somos un equipo de seis personas: compradores, empacadores,
            atención al cliente y un diseñador que se asegura de que cada caja
            llegue a tu puerta bien presentada. Pequeños por elección; presentes
            por convicción.
          </p>

          <h2>Nuestra misión</h2>
          <p>
            Poner al alcance de estudiantes, padres y profesionales de Honduras
            los mejores útiles escolares y de oficina, con precios honestos,
            envíos confiables a todo el territorio nacional y una experiencia de
            compra que dé gusto repetir.
          </p>
        </Prosa>
      </section>

      {/* Narrative numbers */}
      <section
        aria-labelledby="numeros-titulo"
        className="mt-14 rounded-[var(--radius-xl)] bg-primary-50 px-6 py-10 sm:px-10"
      >
        <h2
          id="numeros-titulo"
          className="sr-only"
        >
          Papelería Nova en cifras
        </h2>
        <ul
          role="list"
          className="grid grid-cols-2 gap-6 sm:grid-cols-4"
        >
          {NUMEROS.map((n) => (
            <li key={n.etiqueta} className="text-center">
              <p
                className="font-display text-step-4 font-bold leading-none tracking-tight text-primary"
                aria-label={`${n.cifra} ${n.etiqueta}`}
              >
                {n.cifra}
              </p>
              <p className="mt-2 text-[0.85rem] font-medium leading-snug text-ink-soft">
                {n.etiqueta}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Values */}
      <section aria-labelledby="valores-titulo" className="mt-14">
        <h2
          id="valores-titulo"
          className="font-display text-step-2 font-semibold leading-tight tracking-[-0.02em] text-ink"
        >
          Lo que nos mueve
        </h2>
        <ul
          role="list"
          className="mt-8 grid gap-5 sm:grid-cols-2"
        >
          {VALORES.map((v) => (
            <li
              key={v.titulo}
              className="flex gap-4 rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-accent/10 text-accent">
                <v.icon aria-hidden="true" className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="font-display text-step-1 font-semibold leading-snug text-ink">
                  {v.titulo}
                </h3>
                <p className="mt-1 text-step-0 leading-relaxed text-ink-soft">
                  {v.texto}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA to the catalog */}
      <section
        aria-labelledby="cta-nosotros-titulo"
        className="mt-14 flex flex-col items-center gap-4 rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-paper-2 px-6 py-12 text-center"
      >
        {/* Decorative "notebook" line above the heading */}
        <span
          aria-hidden="true"
          className="inline-block h-1.5 w-10 rounded-full bg-accent/60"
        />
        <h2
          id="cta-nosotros-titulo"
          className="font-display text-step-2 font-semibold leading-tight text-ink"
        >
          ¿Listo para explorar?
        </h2>
        <p className="max-w-md text-step-0 leading-relaxed text-ink-soft">
          Más de 45 productos cuidadosamente elegidos te esperan. Desde lápices
          de primera hasta mochilas que duran todo el ciclo escolar.
        </p>
        <Button asChildLink href="/catalogo" variant="accent" size="lg">
          Ver el catálogo
        </Button>
      </section>
    </div>
  );
}
