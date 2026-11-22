import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { obtenerPedidoPorNumero } from "@/server/pedidos";
import { CuentaPedidoDetalle } from "@/components/storefront/cuenta-pedido-detalle";

/**
 * /cuenta/pedidos/[numero] — Detail of an order (Server Component).
 *
 * `params` is a Promise in Next 16. The number is resolved and
 * `obtenerPedidoPorNumero` is queried (ALREADY scoped to the owner; a
 * VENDEDOR/ADMIN with "pedido:verTodos" can also see it). If it does not exist or
 * there is no access, the action returns `{ ok: false }` with the SAME generic
 * message (it does not leak existence): here that is turned into `notFound()` to
 * show the not-found.tsx.
 *
 * noindex metadata with the title "Pedido <numero>".
 */
type Params = { numero: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { numero } = await params;
  return {
    title: `Pedido ${numero}`,
    robots: { index: false, follow: false },
  };
}

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

export default async function PedidoDetallePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { numero } = await params;
  const resultado = await obtenerPedidoPorNumero(numero);

  if (!resultado.ok) {
    notFound();
  }

  const { pedido } = resultado;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav aria-label="Migas de pan">
        <ol
          role="list"
          className="flex flex-wrap items-center gap-1 text-[0.85rem] text-ink-faint"
        >
          <li>
            <Link
              href="/cuenta"
              className="rounded-[var(--radius-sm)] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Mi cuenta
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          <li>
            <Link
              href="/cuenta/pedidos"
              className="rounded-[var(--radius-sm)] transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Mis pedidos
            </Link>
          </li>
          <ChevronRight aria-hidden="true" className="size-3.5" strokeWidth={2} />
          <li>
            <span aria-current="page" className="font-medium text-ink tabular-nums">
              {pedido.numero}
            </span>
          </li>
        </ol>
      </nav>

      <CuentaPedidoDetalle
        pedido={pedido}
        fecha={formatearFecha(pedido.creadoEn)}
      />
    </div>
  );
}
