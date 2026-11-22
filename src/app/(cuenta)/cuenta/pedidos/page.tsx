import type { Metadata } from "next";
import { misPedidos } from "@/server/cuenta";
import { parsearPaginaPedidos } from "@/lib/validators/cuenta";
import { CuentaPedidoFila } from "@/components/storefront/cuenta-pedido-fila";
import { CuentaPaginacionPedidos } from "@/components/storefront/cuenta-paginacion-pedidos";
import { EstadoVacio } from "@/components/storefront/estado-vacio";
import { Button } from "@/components/ui/button";

/**
 * /cuenta/pedidos — Paginated list of the user's orders (Server Component).
 *
 * `searchParams` is a Promise in Next 16. It is parsed with `parsearPaginaPedidos`
 * (total parser: invalid page => 1) and passed to `misPedidos(page)`. The read
 * throws `AuthError` if there is no session/role and is left to propagate to the
 * boundary (the proxy already requires a session). Empty => EstadoVacio with a
 * CTA to the catalog.
 */
export const metadata: Metadata = {
  title: "Mis pedidos",
  description: "Consulta el estado y el detalle de todos tus pedidos.",
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

export default async function MisPedidosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page } = parsearPaginaPedidos(await searchParams);
  const data = await misPedidos(page);

  if (data.total === 0) {
    return (
      <EstadoVacio
        titulo="Aún no has hecho pedidos"
        descripcion="Cuando completes tu primera compra, podrás seguir su estado y revisar el detalle desde aquí."
      >
        <Button asChildLink href="/catalogo" variant="accent">
          Ir al catálogo
        </Button>
      </EstadoVacio>
    );
  }

  const totalLabel =
    data.total === 1
      ? "1 pedido"
      : `${data.total.toLocaleString("es-HN")} pedidos`;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[0.9rem] text-ink-soft">
        Tienes <span className="font-medium text-ink">{totalLabel}</span> en
        total.
      </p>

      <ul role="list" className="flex flex-col gap-3">
        {data.pedidos.map((pedido) => (
          <li key={pedido.numero}>
            <CuentaPedidoFila
              numero={pedido.numero}
              estado={pedido.estado}
              fecha={formatearFecha(pedido.creadoEn)}
              total={pedido.total}
              totalItems={pedido.totalItems}
            />
          </li>
        ))}
      </ul>

      <CuentaPaginacionPedidos
        pagina={data.pagina}
        totalPaginas={data.totalPaginas}
      />
    </div>
  );
}
