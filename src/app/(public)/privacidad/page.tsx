import type { Metadata } from "next";
import { EncabezadoPagina, Prosa } from "@/components/storefront/prosa";
import { SITIO, NEGOCIO } from "@/lib/seo";

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Política de privacidad de Papelería Nova: qué datos recopilamos, cómo los usamos y cómo los protegemos. Cumplimiento de la ley hondureña de protección de datos.",
  alternates: { canonical: "/privacidad" },
  openGraph: {
    title: "Política de privacidad · Papelería Nova",
    description:
      "Qué datos recopila Papelería Nova, cómo los usamos y cómo los protegemos. Política clara y sin jerga.",
    url: `${SITIO}/privacidad`,
    type: "website",
  },
  twitter: { card: "summary" },
  robots: { index: true, follow: true },
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
      <EncabezadoPagina
        titulo="Política de privacidad"
        descripcion="Sabemos que tu información es valiosa. Aquí te explicamos qué guardamos, por qué y cómo lo protegemos."
        motivo="lapiz"
      />

      <Prosa as="article" className="mt-10">
        <p>
          <strong>Papelería Nova</strong> (operada por{" "}
          <strong>[completar: razón social]</strong>, RTN{" "}
          <strong>[completar: RTN]</strong>) es responsable del tratamiento de
          los datos personales que recopila a través de su tienda en línea. Esta
          Política de Privacidad describe qué información recopilamos, para qué
          la usamos y cómo la protegemos, de conformidad con la{" "}
          <strong>Ley de Protección de Datos Personales de Honduras</strong>{" "}
          [completar: número de decreto] y demás normativa aplicable.
        </p>

        <h2>1. Datos que recopilamos</h2>
        <p>
          Recopilamos únicamente los datos necesarios para brindarte el servicio.
          A continuación describimos cada categoría de forma fiel al sistema real:
        </p>
        <ul>
          <li>
            <strong>Cuenta de usuario:</strong> nombre completo, dirección de
            correo electrónico y contraseña almacenada con hash bcrypt (nunca en
            texto plano). Nunca tenemos acceso a tu contraseña original.
          </li>
          <li>
            <strong>Pedidos y direcciones de envío:</strong> nombre del
            destinatario, dirección de entrega (calle, ciudad, departamento),
            número de teléfono, artículos comprados, montos y estado del pedido.
            Esta información se guarda como historial de transacciones y es
            necesaria para procesar envíos y atender reclamos.
          </li>
          <li>
            <strong>Mensajes de contacto:</strong> nombre, correo electrónico,
            asunto y texto del mensaje enviado a través del formulario de
            contacto. Los mensajes se almacenan para poder responderte y dar
            seguimiento interno.
          </li>
          <li>
            <strong>Carrito de compras:</strong> el contenido de tu carrito se
            guarda localmente en tu navegador (localStorage) y, si inicias
            sesión, se sincroniza con nuestra base de datos para que no pierdas
            tus artículos al cerrar el navegador. Al cerrar sesión, el carrito
            local se limpia automáticamente.
          </li>
        </ul>

        <h2>2. Datos que NO recopilamos</h2>
        <ul>
          <li>
            No almacenamos datos de tarjetas de crédito ni débito. El
            procesamiento de pagos con tarjeta se realizará, cuando esté
            disponible, a través de pasarelas certificadas PCI-DSS externas.
          </li>
          <li>
            No rastreamos tu actividad fuera de la Tienda ni usamos cookies de
            terceros con fines publicitarios de forma activa. Las cookies que
            usamos son estrictamente funcionales (sesión y carrito).
          </li>
          <li>
            No vendemos, alquilamos ni compartimos tu información personal con
            terceros con fines comerciales.
          </li>
        </ul>

        <h2>3. Finalidad del tratamiento</h2>
        <p>Usamos tus datos para:</p>
        <ul>
          <li>Gestionar tu cuenta y autenticarte de forma segura.</li>
          <li>Procesar y entregar tus pedidos.</li>
          <li>Responder tus mensajes y solicitudes de soporte.</li>
          <li>
            Enviarte correos transaccionales relacionados con tu pedido
            (confirmación, número de rastreo, cambios de estado).
          </li>
          <li>
            Cumplir obligaciones legales (facturación, retención de registros
            contables según la ley hondureña).
          </li>
        </ul>

        <h2>4. Base legal del tratamiento</h2>
        <p>
          El tratamiento de tus datos se sustenta en: (a) la ejecución del
          contrato de compraventa al realizar un pedido; (b) tu consentimiento
          al crear una cuenta y aceptar estos términos; y (c) el cumplimiento de
          obligaciones legales aplicables en Honduras.
        </p>

        <h2>5. Conservación de los datos</h2>
        <p>
          Conservamos tu información mientras tu cuenta esté activa o durante el
          tiempo necesario para cumplir los fines descritos. Los registros de
          pedidos se conservan por un mínimo de{" "}
          <strong>[completar: plazo según normativa fiscal hondureña]</strong>{" "}
          años por requisitos contables. Los mensajes de contacto se conservan
          hasta por 12 meses. Puedes solicitar la eliminación de tu cuenta en
          cualquier momento (ver sección 7).
        </p>

        <h2>6. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas razonables para proteger tus datos: conexión
          HTTPS en todo el sitio, contraseñas hasheadas con bcrypt, base de datos
          con acceso restringido y auditorías periódicas de seguridad. Sin
          embargo, ningún sistema es 100 % infalible; en caso de incidente que
          afecte tus datos te notificaremos según lo exige la ley.
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Tienes derecho a acceder, rectificar, cancelar u oponerte al
          tratamiento de tus datos personales (derechos ARCO). Para ejercerlos,
          escríbenos a{" "}
          <a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a> con el asunto
          «Derechos ARCO» e identifícate con el correo asociado a tu cuenta.
          Atenderemos tu solicitud en el plazo legalmente establecido.
        </p>

        <h2>8. Cookies</h2>
        <p>
          Usamos cookies de sesión (necesarias para mantener tu inicio de sesión)
          y almacenamiento local del navegador (para el carrito de compras). No
          usamos cookies de seguimiento entre sitios ni redes publicitarias de
          terceros. Al seguir navegando en la Tienda aceptas este uso. Puedes
          desactivar las cookies en la configuración de tu navegador, aunque
          algunas funciones (sesión, carrito) dejarán de funcionar correctamente.
        </p>

        <h2>9. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad en cualquier momento.
          Los cambios se publicarán en esta página con la fecha de actualización.
          Si los cambios son significativos, te notificaremos por correo
          electrónico.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Para consultas sobre privacidad o protección de datos, escríbenos a{" "}
          <a href={`mailto:${NEGOCIO.email}`}>{NEGOCIO.email}</a> o llámanos al{" "}
          <a href={`tel:${NEGOCIO.telefono.replace(/\s/g, "")}`}>
            {NEGOCIO.telefono}
          </a>
          .
        </p>

        <p>
          <em>
            Última actualización: junio de 2026.{" "}
            [completar: fecha exacta antes de publicar]
          </em>
        </p>
      </Prosa>
    </div>
  );
}
