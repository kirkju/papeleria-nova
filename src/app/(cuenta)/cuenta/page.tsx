import type { Metadata } from "next";
import Link from "next/link";
import { UserRound, KeyRound, MapPin, Package, CalendarDays } from "lucide-react";
import { obtenerPerfil } from "@/server/cuenta";
import { obtenerDireccionesUsuario } from "@/server/direcciones";
import { CuentaSeccion } from "@/components/storefront/cuenta-seccion";
import { CuentaPerfilForm } from "@/components/storefront/cuenta-perfil-form";
import { CuentaPasswordForm } from "@/components/storefront/cuenta-password-form";
import {
  CuentaDirecciones,
  type DireccionVista,
} from "@/components/storefront/cuenta-direcciones";

/**
 * /cuenta — User profile (Server Component).
 *
 * Loads the profile (`obtenerPerfil`) and the addresses
 * (`obtenerDireccionesUsuario`) in parallel. If reading the profile throws
 * `AuthError`, it propagates (the proxy already requires a session; normally
 * there is one). Three sections:
 *  a) Your data: editable name + read-only email + summary (sign-up date and
 *     number of orders, with a link).
 *  b) Security: password change.
 *  c) Addresses: list + actions (set default / delete).
 */
export const metadata: Metadata = {
  title: "Perfil",
  description: "Gestiona tus datos, contraseña y direcciones de envío.",
};

/** Formats an ISO date as DD/MM/YYYY with the es-HN locale. */
const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatearFecha(iso: string): string {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? "—" : formatoFecha.format(fecha);
}

export default async function CuentaPerfilPage() {
  const [perfil, resultadoDirecciones] = await Promise.all([
    obtenerPerfil(),
    obtenerDireccionesUsuario(),
  ]);

  const direcciones: DireccionVista[] = resultadoDirecciones.ok
    ? resultadoDirecciones.direcciones.map((d) => ({
        id: d.id,
        linea1: d.linea1,
        linea2: d.linea2,
        ciudad: d.ciudad,
        departamento: d.departamento,
        telefono: d.telefono,
        esPredeterminada: d.esPredeterminada,
      }))
    : [];

  const pedidosLabel =
    perfil.totalPedidos === 1
      ? "1 pedido realizado"
      : `${perfil.totalPedidos.toLocaleString("es-HN")} pedidos realizados`;

  return (
    <div className="flex flex-col gap-6">
      {/* a) Profile data */}
      <CuentaSeccion
        titulo="Tus datos"
        icono={<UserRound strokeWidth={1.85} />}
        descripcion="Tu nombre y correo de la cuenta."
      >
        <CuentaPerfilForm nombreActual={perfil.nombre} email={perfil.email} />

        {/* Account summary: sign-up date + orders (mini bento of two cells). */}
        <dl className="mt-6 grid gap-3 border-t border-dashed border-line pt-5 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-[var(--radius-md)] bg-paper-3/40 px-4 py-3">
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-paper text-primary-600"
            >
              <CalendarDays className="size-5" strokeWidth={1.85} />
            </span>
            <div>
              <dt className="text-[0.78rem] uppercase tracking-wide text-ink-faint">
                Miembro desde
              </dt>
              <dd className="text-step-0 font-medium text-ink tabular-nums">
                {formatearFecha(perfil.creadoEn)}
              </dd>
            </div>
          </div>

          <Link
            href="/cuenta/pedidos"
            className="flex items-center gap-3 rounded-[var(--radius-md)] bg-paper-3/40 px-4 py-3 transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <span
              aria-hidden="true"
              className="grid size-9 place-items-center rounded-[var(--radius-md)] bg-paper text-accent-600"
            >
              <Package className="size-5" strokeWidth={1.85} />
            </span>
            <div>
              <dt className="text-[0.78rem] uppercase tracking-wide text-ink-faint">
                Pedidos
              </dt>
              <dd className="text-step-0 font-medium text-ink">
                {pedidosLabel}
                <span aria-hidden="true" className="ml-1 text-primary-600">
                  →
                </span>
              </dd>
            </div>
          </Link>
        </dl>
      </CuentaSeccion>

      {/* b) Security / password */}
      <CuentaSeccion
        titulo="Seguridad"
        icono={<KeyRound strokeWidth={1.85} />}
        descripcion="Cambia tu contraseña cuando lo necesites."
      >
        <CuentaPasswordForm />
      </CuentaSeccion>

      {/* c) Addresses */}
      <CuentaSeccion
        titulo="Direcciones de envío"
        icono={<MapPin strokeWidth={1.85} />}
        descripcion="Tus direcciones guardadas para futuros pedidos."
      >
        <CuentaDirecciones direcciones={direcciones} />
      </CuentaSeccion>
    </div>
  );
}
