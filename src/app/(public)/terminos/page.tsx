import type { Metadata } from "next";
import { EncabezadoPagina, Prosa } from "@/components/storefront/prosa";
import { SITIO, NEGOCIO } from "@/lib/seo";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Términos y condiciones",
  description:
    "Términos y condiciones de uso de Papelería Nova: compras, envíos, devoluciones, propiedad intelectual y responsabilidades. Vigentes en Honduras.",
  alternates: { canonical: "/terminos" },
  openGraph: {
    title: "Términos y condiciones · Papelería Nova",
    description:
      "Términos y condiciones de uso de la tienda en línea de Papelería Nova. Vigentes en Honduras.",
    url: `${SITIO}/terminos`,
    type: "website",
  },
  twitter: { card: "summary" },
  robots: { index: true, follow: true },
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <EncabezadoPagina
        titulo="Términos y condiciones"
        descripcion="Por favor léelos antes de realizar tu primera compra. Son claros y sin letra pequeña."
        motivo="lapiz"
      />

      <Prosa as="article" className="mt-10">
        <p>
          Los presentes Términos y Condiciones regulan el uso de la tienda en
          línea de <strong>Papelería Nova</strong> (en adelante, «la Tienda»),
          operada por{" "}
          <strong>[completar: razón social o nombre completo del titular]</strong>
          , con RTN{" "}
          <strong>[completar: RTN]</strong>, con domicilio en{" "}
          <strong>{NEGOCIO.direccion.calle}, {NEGOCIO.direccion.ciudad}, Honduras</strong>.
          Al navegar o realizar una compra en la Tienda, el usuario acepta estos
          términos en su totalidad.
        </p>

        <h2>1. Objeto</h2>
        <p>
          La Tienda ofrece a consumidores finales la compra de útiles escolares,
          de arte y de oficina. Papelería Nova se reserva el derecho de modificar
          el catálogo, los precios y estas condiciones en cualquier momento.
          Los cambios entrarán en vigor desde su publicación en este sitio.
        </p>

        <h2>2. Registro y cuenta de usuario</h2>
        <p>
          Para realizar una compra es necesario crear una cuenta con nombre, correo
          electrónico y contraseña. El usuario es responsable de mantener la
          confidencialidad de sus credenciales y de toda actividad realizada desde
          su cuenta. Papelería Nova no se hace responsable por accesos no
          autorizados derivados de la negligencia del usuario.
        </p>
        <p>
          Papelería Nova se reserva el derecho de suspender o cancelar cuentas que
          incurran en uso fraudulento, suplantación de identidad o cualquier
          actividad que contravenga estas condiciones o la legislación hondureña.
        </p>

        <h2>3. Precios y disponibilidad</h2>
        <p>
          Todos los precios se expresan en Lempiras hondureños (L) e incluyen los
          impuestos aplicables. La disponibilidad de stock se actualiza en tiempo
          real; si por error se procesa un pedido de un artículo agotado,
          Papelería Nova lo notificará al usuario y ofrecerá un reembolso total o
          un producto alternativo.
        </p>
        <p>
          Nos reservamos el derecho de corregir errores tipográficos de precio
          antes de confirmar el pedido. En ese caso, el usuario será notificado y
          podrá cancelar la compra sin cargo.
        </p>

        <h2>4. Proceso de compra</h2>
        <p>
          El contrato de compraventa se perfecciona cuando Papelería Nova envía al
          usuario la confirmación del pedido por correo electrónico. El número de
          pedido generado es el identificador único de la transacción. Guárdalo
          para cualquier consulta posterior.
        </p>

        <h2>5. Pagos</h2>
        <p>
          Actualmente se acepta pago <strong>contra entrega</strong> (efectivo al
          recibir el pedido). El pago con tarjeta de crédito o débito se habilitará
          próximamente. Papelería Nova no almacena datos de tarjetas; el
          procesamiento se realizará a través de pasarelas de pago certificadas.
        </p>

        <h2>6. Envíos</h2>
        <p>
          Los envíos se realizan a todo el territorio hondureño a través de empresas
          de mensajería aliadas. El tiempo estimado es de 2 a 4 días hábiles en
          ciudades principales y de 4 a 6 días en zonas rurales. El costo de envío
          se calcula al finalizar la compra y se muestra antes de confirmar el pago.
          Pedidos superiores a{" "}
          <strong>L 1,500.00</strong> reciben envío gratuito.
        </p>
        <p>
          El riesgo de pérdida o daño del producto se transfiere al usuario en el
          momento de la entrega. En caso de daño durante el transporte, el usuario
          debe notificarlo dentro de las 48 horas siguientes a la recepción.
        </p>

        <h2>7. Devoluciones y cambios</h2>
        <p>
          Se aceptan devoluciones o cambios dentro de los{" "}
          <strong>7 días calendario</strong> posteriores a la entrega, siempre que
          el artículo se encuentre en su estado original, sin usar y con el empaque
          intacto. Para iniciar el proceso, el usuario debe contactar a Papelería
          Nova a través del formulario de contacto o al correo{" "}
          <strong>{NEGOCIO.email}</strong>, indicando el número de pedido y el
          motivo de la devolución.
        </p>
        <p>
          No se aceptan devoluciones de artículos de higiene personal, consumibles
          abiertos (tinta, pegamento) ni artículos personalizados, salvo defecto
          de fábrica comprobado.
        </p>

        <h2>8. Garantías</h2>
        <p>
          Los productos comercializados cuentan con la garantía del fabricante.
          Papelería Nova actúa como intermediario en los procesos de garantía y
          facilitará la comunicación entre el usuario y el fabricante cuando sea
          necesario. La garantía no cubre el desgaste normal por uso ni daños
          causados por mal uso del producto.
        </p>

        <h2>9. Propiedad intelectual</h2>
        <p>
          Todos los contenidos de la Tienda (textos, imágenes, logotipos, diseños
          y código) son propiedad de Papelería Nova o están licenciados para su uso.
          Queda prohibida su reproducción, distribución o modificación sin
          autorización expresa por escrito.
        </p>

        <h2>10. Limitación de responsabilidad</h2>
        <p>
          Papelería Nova no se hace responsable por daños indirectos, pérdida de
          datos, lucro cesante ni ningún otro daño derivado del uso o la
          imposibilidad de uso de la Tienda, salvo que la ley hondureña disponga
          lo contrario. La responsabilidad máxima de Papelería Nova ante el usuario
          se limita al monto pagado en la transacción correspondiente.
        </p>

        <h2>11. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos y Condiciones se rigen por la legislación de la República
          de Honduras. Cualquier disputa que no pueda resolverse amigablemente
          será sometida a los tribunales de{" "}
          <strong>[completar: ciudad y juzgado competente]</strong>, con renuncia
          expresa a cualquier otro fuero.
        </p>

        <h2>12. Contacto</h2>
        <p>
          Para cualquier consulta relacionada con estos Términos, puedes
          escribirnos a{" "}
          <a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a> o llamarnos al{" "}
          <a href={`tel:${NEGOCIO.telefono.replace(/\s/g, "")}`}>
            {NEGOCIO.telefono}
          </a>
          .
        </p>

        <p>
          <em>Última actualización: junio de 2026. [completar: fecha exacta antes de publicar]</em>
        </p>
      </Prosa>
    </div>
  );
}
