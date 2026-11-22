import type { Metadata } from "next";
import Link from "next/link";
import { EncabezadoPagina } from "@/components/storefront/prosa";
import { AcordeonFaq, type ItemFaq } from "@/components/storefront/acordeon-faq";
import { SITIO, jsonLd } from "@/lib/seo";
import { COSTO_ENVIO, ENVIO_GRATIS_DESDE } from "@/lib/pedidos/calculos";
import { formatearLempiras } from "@/lib/utils";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas a las preguntas más comunes sobre envíos, pagos, devoluciones, facturación y pedidos en Papelería Nova. Servicio en todo Honduras.",
  alternates: { canonical: "/preguntas-frecuentes" },
  openGraph: {
    title: "Preguntas frecuentes · Papelería Nova",
    description:
      "Respuestas a las preguntas más comunes sobre envíos, pagos, devoluciones, facturación y pedidos en Papelería Nova.",
    url: `${SITIO}/preguntas-frecuentes`,
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

/* ── FAQ (SINGLE SOURCE: used by the accordion and the JSON-LD) ──────────── */

const PREGUNTAS: ItemFaq[] = [
  {
    pregunta: "¿Hacen envíos a todo Honduras?",
    respuesta:
      "Sí, enviamos a todo el territorio nacional: Tegucigalpa, San Pedro Sula, La Ceiba, Comayagua, Choluteca y demás departamentos. El tiempo estimado de entrega es de 2 a 4 días hábiles en las ciudades principales y de 4 a 6 días hábiles en zonas rurales. Recibirás un correo con el número de rastreo una vez que tu pedido salga de nuestras manos.",
  },
  {
    pregunta: "¿Cuánto cuesta el envío?",
    respuesta: `El costo de envío estándar es de ${formatearLempiras(COSTO_ENVIO)} por pedido. Si tu compra supera los ${formatearLempiras(ENVIO_GRATIS_DESDE)}, el envío es completamente gratis sin importar la distancia. El costo exacto lo verás en el resumen antes de confirmar tu pedido, así que nunca habrá sorpresas.`,
  },
  {
    pregunta: "¿Qué métodos de pago aceptan?",
    respuesta:
      "Actualmente aceptamos pago contra entrega (efectivo al recibir tu pedido). El pago con tarjeta de crédito o débito llegará próximamente a nuestra tienda en línea. Si necesitas pagar con transferencia bancaria para un pedido de mayoreo, escríbenos al formulario de contacto y lo coordinamos.",
  },
  {
    pregunta: "¿Cómo puedo rastrear mi pedido?",
    respuesta:
      "Una vez que tu pedido sea enviado recibirás un correo electrónico con el número de rastreo y el enlace a la empresa de transporte. También puedes consultar el estado de tu pedido en la sección \"Mis pedidos\" si tienes una cuenta en Papelería Nova. Si tienes alguna duda, escríbenos a hola@papelerianova.hn con tu número de pedido.",
  },
  {
    pregunta: "¿Puedo cambiar o devolver un producto?",
    respuesta:
      "Sí. Aceptamos cambios y devoluciones dentro de los 7 días calendario posteriores a la entrega, siempre que el artículo esté en su estado original, sin usar y con el empaque intacto. Para iniciar el proceso, escríbenos a hola@papelerianova.hn con el número de pedido, el artículo a devolver y el motivo. Cubrimos el costo del envío de retorno solo en caso de error nuestro (producto equivocado o defectuoso).",
  },
  {
    pregunta: "¿Emiten factura o recibo con RTN?",
    respuesta:
      "Sí. Si necesitas factura con tu RTN personal o empresarial, indícalo en el campo de notas al finalizar tu compra o escríbenos antes de que tu pedido sea procesado. El proceso de facturación tiene un plazo de hasta 5 días hábiles después de la entrega.",
  },
  {
    pregunta: "¿Tienen precios de mayoreo para escuelas o empresas?",
    respuesta:
      "Sí, manejamos condiciones especiales para pedidos institucionales, escuelas, colegios y empresas que compran en volumen. Escríbenos a través del formulario de contacto detallando los artículos, cantidades y plazos que necesitas y te preparamos una cotización sin compromiso en menos de 48 horas.",
  },
  {
    pregunta: "¿Cuál es el horario de atención?",
    respuesta:
      "Atendemos de lunes a viernes de 8:00 a.m. a 5:00 p.m. y los sábados de 8:00 a.m. a 12:00 p.m. (hora de Honduras). Los mensajes recibidos fuera de ese horario o durante días festivos los respondemos el siguiente día hábil.",
  },
  {
    pregunta: "¿El stock del sitio web es en tiempo real?",
    respuesta:
      "Sí. La disponibilidad que ves en cada ficha de producto refleja nuestro inventario actual. Si un artículo aparece como \"Disponible\", está en bodega listo para ser enviado. Si dice \"Pocas unidades\", quedan 5 o menos en existencia. Cuando un artículo se agota, el botón de compra se desactiva automáticamente.",
  },
  {
    pregunta: "¿Puedo comprar sin crear una cuenta?",
    respuesta:
      "Puedes explorar el catálogo y agregar productos al carrito sin cuenta. Para completar tu compra necesitarás registrarte o iniciar sesión: esto nos permite enviarte la confirmación del pedido, el rastreo y gestionar posibles cambios o devoluciones de forma eficiente. El registro es gratuito y solo te pide tu nombre, correo y contraseña.",
  },
];

/* ── JSON-LD: FAQPage ─────────────────────────────────────────────────────── */

const schemaFaqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PREGUNTAS.map((p) => ({
    "@type": "Question",
    name: p.pregunta,
    acceptedAnswer: {
      "@type": "Answer",
      text: p.respuesta,
    },
  })),
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function PreguntasFrecuentesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(schemaFaqPage) }}
      />

      <EncabezadoPagina
        titulo="Preguntas frecuentes"
        acento="frecuentes"
        descripcion="Todo lo que necesitas saber sobre envíos, pagos, devoluciones y más. Si no encuentras tu respuesta aquí, escríbenos."
        motivo="clips"
      />

      <section
        aria-labelledby="faq-seccion-titulo"
        className="mt-10"
      >
        <h2 id="faq-seccion-titulo" className="sr-only">
          Listado de preguntas frecuentes
        </h2>
        <AcordeonFaq items={PREGUNTAS} />
      </section>

      {/* Contact CTA */}
      <div className="mt-12 flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-paper-2 px-6 py-8 text-center">
        <p className="text-step-0 font-medium text-ink">
          ¿No encontraste lo que buscabas?
        </p>
        <p className="text-step-0 text-ink-soft">
          Escríbenos directamente y te respondemos en menos de 24 horas hábiles.
        </p>
        <Link
          href="/contacto"
          className="mt-1 inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-6 text-step-0 font-medium text-on-accent shadow-card transition-colors hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Ir al formulario de contacto
        </Link>
      </div>
    </div>
  );
}
