import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import {
  obtenerPedidoAdmin,
  type PedidoDetalleAdmin,
} from "@/server/admin/pedidos";
import { AuthError } from "@/lib/auth/guard";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  type ColumnaTabla,
} from "@/components/admin";
import { PedidosCambiarEstado } from "@/components/admin/pedidos-cambiar-estado";
import { Card } from "@/components/ui/card";
import { formatearLempiras } from "@/lib/utils";
import { Acceso403 } from "../acceso-403";

/**
 * Detail of an order in the admin (Server Component).
 *
 * `obtenerPedidoAdmin` requires "pedido:verTodos" (VENDEDOR|ADMIN) on the server:
 * if the role falls short it throws `AuthError` (caught -> 403); if it does not
 * exist, it returns null (-> notFound). The status change is handled by a client
 * island that only offers the `transicionesValidas` already computed here (state
 * machine); the hard barrier of the change lives in the server action.
 */
export const dynamic = "force-dynamic";

type Params = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  let pedido: PedidoDetalleAdmin | null = null;
  try {
    pedido = await obtenerPedidoAdmin(id);
  } catch {
    // In metadata we do not differentiate: the page does the fine-grained handling (403/404).
  }
  return {
    title: pedido ? `Pedido ${pedido.numero}` : "Pedido",
  };
}

/** DD/MM/YYYY HH:mm format with the es-HN locale. */
const formatoFechaHora = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fechaHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFechaHora.format(d);
}

/** Terminal statuses: no transitions (informational panel, no actions). */
const MENSAJE_TERMINAL: Record<string, string> = {
  ENTREGADO: "Este pedido está entregado. No requiere más cambios de estado.",
  CANCELADO: "Este pedido fue cancelado. Es un estado final.",
};

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  let pedido: PedidoDetalleAdmin | null;
  try {
    pedido = await obtenerPedidoAdmin(id);
  } catch (error) {
    if (error instanceof AuthError) {
      return <Acceso403 mensaje={error.mensajePublico} />;
    }
    throw error;
  }

  if (!pedido) notFound();

  const { direccion } = pedido;
  const esTerminal = pedido.transicionesValidas.length === 0;

  const columnas: ColumnaTabla<PedidoDetalleAdmin["items"][number]>[] = [
    {
      clave: "nombre",
      encabezado: "Producto",
      render: (i) => (
        <span className="font-medium text-ink">
          {i.nombre}
          {!i.disponible && (
            <span className="ml-2 text-[0.78rem] font-normal italic text-ink-faint">
              (ya no disponible en el catálogo)
            </span>
          )}
        </span>
      ),
    },
    {
      clave: "sku",
      encabezado: "SKU",
      render: (i) => (
        <span className="whitespace-nowrap font-mono text-step--1 text-ink-faint">{i.sku}</span>
      ),
    },
    {
      clave: "precio",
      encabezado: "Precio",
      alinear: "right",
      render: (i) => (
        <span className="tabular-nums text-ink-soft">
          {formatearLempiras(i.precio)}
        </span>
      ),
    },
    {
      clave: "cantidad",
      encabezado: "Cant.",
      alinear: "right",
      render: (i) => <span className="tabular-nums text-ink">{i.cantidad}</span>,
    },
    {
      clave: "subtotalLinea",
      encabezado: "Subtotal",
      alinear: "right",
      render: (i) => (
        <span className="font-semibold tabular-nums text-ink">
          {formatearLempiras(i.subtotalLinea)}
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="text-step--1">
        <ol className="flex flex-wrap items-center gap-1.5 text-ink-faint">
          <li>
            <Link
              href="/admin/pedidos"
              className="font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-2 rounded-[var(--radius-sm)]"
            >
              Pedidos
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="size-3.5" strokeWidth={2.5} />
          </li>
          <li aria-current="page" className="font-medium text-ink">
            {pedido.numero}
          </li>
        </ol>
      </nav>

      <div className="flex flex-col gap-4">
        <Link
          href="/admin/pedidos"
          className="inline-flex w-fit items-center gap-1.5 text-step--1 font-medium text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-2 rounded-[var(--radius-sm)]"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2.5} />
          Volver a pedidos
        </Link>

        <PageHeader
          titulo={`Pedido ${pedido.numero}`}
          descripcion={`Creado el ${fechaHora(pedido.creadoEn)} · actualizado ${fechaHora(
            pedido.actualizadoEn,
          )}`}
        >
          <StatusBadge estado={pedido.estado} />
        </PageHeader>
      </div>

      {/* Three cards: Customer · Shipping · Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Customer */}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 font-display text-step-0 font-semibold text-ink">
            <User
              aria-hidden="true"
              className="size-4.5 text-ink-faint"
              strokeWidth={2}
            />
            Cliente
          </h2>
          <dl className="flex flex-col gap-2 text-step--1">
            <div className="flex flex-col gap-0.5">
              <dt className="text-ink-faint">Nombre</dt>
              <dd className="font-medium text-ink">{pedido.cliente.nombre}</dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="text-ink-faint">Correo</dt>
              <dd className="flex items-center gap-1.5 break-all text-ink">
                <Mail
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-ink-faint"
                  strokeWidth={2}
                />
                {pedido.cliente.email}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Shipping */}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 font-display text-step-0 font-semibold text-ink">
            <MapPin
              aria-hidden="true"
              className="size-4.5 text-ink-faint"
              strokeWidth={2}
            />
            Envío
          </h2>
          <address className="flex flex-col gap-1 text-step--1 not-italic text-ink">
            <span className="font-medium">{direccion.nombre}</span>
            <span className="text-ink-soft">{direccion.linea1}</span>
            {direccion.linea2 ? (
              <span className="text-ink-soft">{direccion.linea2}</span>
            ) : null}
            <span className="text-ink-soft">
              {[direccion.ciudad, direccion.departamento]
                .filter(Boolean)
                .join(", ")}
            </span>
            {direccion.telefono ? (
              <span className="mt-1 flex items-center gap-1.5 text-ink">
                <Phone
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-ink-faint"
                  strokeWidth={2}
                />
                {direccion.telefono}
              </span>
            ) : null}
          </address>
        </Card>

        {/* Summary */}
        <Card className="flex flex-col gap-3 p-5">
          <h2 className="font-display text-step-0 font-semibold text-ink">
            Resumen
          </h2>
          <dl className="flex flex-col gap-2 text-step--1">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="tabular-nums text-ink">
                {formatearLempiras(pedido.subtotal)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-soft">Envío</dt>
              <dd className="tabular-nums text-ink">
                {pedido.envio > 0 ? formatearLempiras(pedido.envio) : "Gratis"}
              </dd>
            </div>
            <div className="mt-1 flex items-center justify-between gap-3 border-t border-line pt-2.5">
              <dt className="font-semibold text-ink">Total</dt>
              <dd className="font-display text-step-1 font-bold tabular-nums text-ink">
                {formatearLempiras(pedido.total)}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Table of items (snapshots) */}
      <section className="flex flex-col gap-3" aria-labelledby="titulo-articulos">
        <h2
          id="titulo-articulos"
          className="font-display text-step-1 font-semibold text-ink"
        >
          Artículos
        </h2>
        <DataTable
          caption="Artículos del pedido con precio, cantidad y subtotal"
          claveFila={(i) => `${i.sku}-${i.nombre}`}
          columnas={columnas}
          filas={pedido.items}
        />
      </section>

      {/* Status change panel / terminal informational panel */}
      <section
        className="rounded-[var(--radius-lg)] border border-line bg-paper p-5"
        aria-labelledby="titulo-estado"
      >
        <h2
          id="titulo-estado"
          className="mb-4 font-display text-step-1 font-semibold text-ink"
        >
          Estado del pedido
        </h2>
        {esTerminal ? (
          <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-line bg-paper-2 px-4 py-3">
            <Lock
              aria-hidden="true"
              className="mt-0.5 size-4.5 shrink-0 text-ink-faint"
              strokeWidth={2}
            />
            <div className="flex flex-col gap-1.5">
              <p className="text-step-0 text-ink-soft">
                {MENSAJE_TERMINAL[pedido.estado] ??
                  "Este pedido no admite más cambios de estado."}
              </p>
              <span className="w-fit">
                <StatusBadge estado={pedido.estado} />
              </span>
            </div>
          </div>
        ) : (
          <PedidosCambiarEstado
            pedidoId={pedido.id}
            estadoActual={pedido.estado}
            transicionesValidas={pedido.transicionesValidas}
          />
        )}
      </section>
    </div>
  );
}
