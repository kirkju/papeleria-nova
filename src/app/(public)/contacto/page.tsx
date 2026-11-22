import type { Metadata } from "next";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { EncabezadoPagina } from "@/components/storefront/prosa";
import { FormularioContacto } from "@/components/storefront/formulario-contacto";
import { enviarMensajeContacto } from "@/server/contacto";
import { NEGOCIO, SITIO, jsonLd } from "@/lib/seo";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Escríbenos con tus dudas, pedidos especiales o sugerencias. Respondemos en horario de oficina. Formulario de contacto, teléfono y dirección en Tegucigalpa.",
  alternates: { canonical: "/contacto" },
  openGraph: {
    title: "Contacto · Papelería Nova",
    description:
      "Escríbenos con tus dudas, pedidos especiales o sugerencias. Respondemos en horario de oficina.",
    url: `${SITIO}/contacto`,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ── JSON-LD ──────────────────────────────────────────────────────────────── */

const schemaContactPage = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: `Contacto — ${NEGOCIO.nombre}`,
  url: `${SITIO}/contacto`,
  mainEntity: {
    "@type": "LocalBusiness",
    name: NEGOCIO.nombre,
    description: NEGOCIO.lema,
    url: SITIO,
    email: NEGOCIO.email,
    telephone: NEGOCIO.telefono,
    openingHours: "Mo-Fr 08:00-17:00, Sa 08:00-12:00",
    address: {
      "@type": "PostalAddress",
      streetAddress: NEGOCIO.direccion.calle,
      addressLocality: NEGOCIO.direccion.ciudad,
      addressRegion: NEGOCIO.direccion.departamento,
      addressCountry: NEGOCIO.direccion.pais,
    },
  },
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ContactoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      {/* JSON-LD: ContactPage + LocalBusiness */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemaContactPage) }}
      />

      <EncabezadoPagina
        titulo="Hablemos"
        acento="Hablemos"
        descripcion="¿Dudas con tu pedido, pedido especial para una escuela o simplemente quieres saludarnos? Aquí estamos."
        motivo="carta"
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_22rem]">
        {/* Form */}
        <section aria-labelledby="form-contacto-titulo">
          <h2
            id="form-contacto-titulo"
            className="mb-6 font-display text-step-1 font-semibold leading-snug text-ink"
          >
            Envíanos un mensaje
          </h2>
          <FormularioContacto action={enviarMensajeContacto} />
        </section>

        {/* Contact details */}
        <aside>
          <div className="rounded-[var(--radius-xl)] border border-line bg-paper-2 p-6 shadow-card">
            {/* Header of the contact panel */}
            <div className="mb-5 flex justify-between">
              <h2 className="font-display text-step-1 font-semibold leading-snug text-ink">
                Información de contacto
              </h2>
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-accent/15 text-accent">
                <Mail aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
              </span>
            </div>

            <ul role="list" className="flex flex-col gap-5">
              {/* Phone */}
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600">
                  <Phone aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[0.8rem] font-semibold uppercase tracking-wide text-ink-faint">
                    Teléfono
                  </p>
                  <a
                    href={`tel:${NEGOCIO.telefono.replace(/\s/g, "")}`}
                    className="mt-0.5 text-step-0 font-medium text-ink underline-offset-2 hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-[var(--radius-sm)]"
                  >
                    {NEGOCIO.telefono}
                  </a>
                </div>
              </li>

              {/* Email */}
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600">
                  <Mail aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[0.8rem] font-semibold uppercase tracking-wide text-ink-faint">
                    Correo electrónico
                  </p>
                  <a
                    href={`mailto:${NEGOCIO.email}`}
                    className="mt-0.5 break-all text-step-0 font-medium text-ink underline-offset-2 hover:text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-[var(--radius-sm)]"
                  >
                    {NEGOCIO.email}
                  </a>
                </div>
              </li>

              {/* Address */}
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600">
                  <MapPin aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[0.8rem] font-semibold uppercase tracking-wide text-ink-faint">
                    Dirección
                  </p>
                  <address className="mt-0.5 not-italic text-step-0 leading-relaxed text-ink-soft">
                    {NEGOCIO.direccion.calle}
                    <br />
                    {NEGOCIO.direccion.ciudad},{" "}
                    {NEGOCIO.direccion.departamento}
                    <br />
                    Honduras
                  </address>
                </div>
              </li>

              {/* Opening hours */}
              <li className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600">
                  <Clock aria-hidden="true" className="size-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[0.8rem] font-semibold uppercase tracking-wide text-ink-faint">
                    Horario de atención
                  </p>
                  <p className="mt-0.5 text-step-0 leading-relaxed text-ink-soft">
                    {NEGOCIO.horarios}
                  </p>
                  <p className="mt-1 text-[0.8rem] text-ink-faint">
                    Respondemos mensajes de lunes a viernes.
                  </p>
                </div>
              </li>
            </ul>

            {/* Notebook separator */}
            <hr
              aria-hidden="true"
              className="my-6 border-0 border-t-2 border-dashed border-line-strong"
            />

            {/* Note about the response time */}
            <p className="rounded-[var(--radius-md)] bg-amber/10 px-4 py-3 text-[0.85rem] leading-relaxed text-ink-soft">
              <strong className="font-semibold text-ink">Tiempo de respuesta:</strong>{" "}
              respondemos en menos de 24 horas hábiles. Para pedidos urgentes,
              llama directamente al número de arriba.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
