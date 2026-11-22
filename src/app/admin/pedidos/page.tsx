import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import {
  parsearFiltrosPedidos,
  ESTADOS_PEDIDO_FILTRO,
  ETIQUETA_ESTADO,
} from "@/lib/validators/admin";
import { listarPedidosAdmin, type PedidoFilaAdmin } from "@/server/admin/pedidos";
import { AuthError } from "@/lib/auth/guard";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  EmptyStateAdmin,
  PaginacionAdmin,
  type ColumnaTabla,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { formatearLempiras } from "@/lib/utils";
import { Acceso403 } from "./acceso-403";

/**
 * Admin orders — paginated, filterable and searchable list (Server Component).
 *
 * The URL is the source of truth: `parsearFiltrosPedidos` normalizes the
 * searchParams (q/estado/desde/hasta/page) and `listarPedidosAdmin` queries
 * Prisma behind the hard barrier "pedido:verTodos" (VENDEDOR|ADMIN). If the role
 * falls short, `AuthError` is caught here and an accessible 403 is rendered (the
 * /admin/** proxy is already the earlier UX barrier).
 *
 * Dynamic: `searchParams` is a Promise in Next 16 and the queries depend on
 * it, so it is not prerendered at build time.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos",
  description: "Gestiona y cambia el estado de los pedidos de Papelería Nova.",
};

type SearchParams = Record<string, string | string[] | undefined>;

/** Takes the first value of a searchParam (it can come repeated as an array). */
function primerValor(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/** DD/MM/YYYY format with the es-HN locale (localization rule). */
const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFecha.format(d);
}

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filtros = parsearFiltrosPedidos(sp);

  let datos;
  try {
    datos = await listarPedidosAdmin(filtros);
  } catch (error) {
    if (error instanceof AuthError) {
      return <Acceso403 mensaje={error.mensajePublico} />;
    }
    throw error;
  }

  const { pedidos, total, pagina, totalPaginas } = datos;
  const hayResultados = pedidos.length > 0;

  // Current params (strings only, without "page") to preserve in the pagination.
  const paramsActuales = Object.fromEntries(
    Object.entries(sp).flatMap(([clave, valor]) => {
      if (clave === "page") return [];
      const v = primerValor(valor);
      return v !== undefined && v !== "" ? [[clave, v]] : [];
    }),
  ) as Record<string, string>;

  // Are any filters active? (for the empty-state message).
  const hayFiltros =
    Boolean(filtros.q) ||
    filtros.estado !== "todos" ||
    Boolean(filtros.desde) ||
    Boolean(filtros.hasta);

  const contador =
    total === 1 ? "1 pedido" : `${total.toLocaleString("es-HN")} pedidos`;

  const columnas: ColumnaTabla<PedidoFilaAdmin>[] = [
    {
      clave: "numero",
      encabezado: "Pedido",
      render: (p) => (
        <Link
          href={`/admin/pedidos/${p.id}`}
          className="font-semibold text-primary-600 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-[var(--radius-sm)]"
        >
          {p.numero}
        </Link>
      ),
    },
    {
      clave: "cliente",
      encabezado: "Cliente",
      render: (p) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-ink">
            {p.cliente.nombre}
          </span>
          <span className="truncate text-step--1 text-ink-faint">
            {p.cliente.email}
          </span>
        </div>
      ),
    },
    {
      clave: "totalItems",
      encabezado: "Artículos",
      alinear: "right",
      render: (p) => (
        <span className="tabular-nums text-ink-soft">{p.totalItems}</span>
      ),
    },
    {
      clave: "total",
      encabezado: "Total",
      alinear: "right",
      render: (p) => (
        <span className="font-semibold tabular-nums text-ink">
          {formatearLempiras(p.total)}
        </span>
      ),
    },
    {
      clave: "estado",
      encabezado: "Estado",
      render: (p) => <StatusBadge estado={p.estado} />,
    },
    {
      clave: "creadoEn",
      encabezado: "Fecha",
      alinear: "right",
      render: (p) => (
        <time
          dateTime={p.creadoEn}
          className="whitespace-nowrap tabular-nums text-ink-soft"
        >
          {fechaCorta(p.creadoEn)}
        </time>
      ),
    },
    {
      clave: "acciones",
      encabezado: <span className="sr-only">Acciones</span>,
      alinear: "right",
      render: (p) => (
        <Link
          href={`/admin/pedidos/${p.id}`}
          aria-label={`Ver el pedido ${p.numero}`}
          className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-2 py-1 text-step--1 font-medium text-primary-600 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
        >
          Ver
          <ChevronRight aria-hidden="true" className="size-4" strokeWidth={2.5} />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Pedidos"
        descripcion="Busca, filtra y cambia el estado de los pedidos."
      />

      {/* Filters (GET form: the URL is the source of truth) */}
      <form
        method="get"
        role="search"
        aria-label="Filtrar pedidos"
        className="grid grid-cols-1 gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto_auto]"
      >
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-q"
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Buscar
          </label>
          <input
            id="filtro-q"
            type="search"
            name="q"
            defaultValue={filtros.q ?? ""}
            placeholder="Número o cliente…"
            className="h-11 rounded-[var(--radius-md)] border border-line bg-paper px-3.5 text-step-0 text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-line-strong"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-estado"
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Estado
          </label>
          <select
            id="filtro-estado"
            name="estado"
            defaultValue={filtros.estado}
            className="h-11 rounded-[var(--radius-md)] border border-line bg-paper px-3 text-step-0 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-line-strong"
          >
            {ESTADOS_PEDIDO_FILTRO.map((e) => (
              <option key={e} value={e}>
                {e === "todos" ? "Todos los estados" : ETIQUETA_ESTADO[e]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-desde"
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Desde
          </label>
          <input
            id="filtro-desde"
            type="date"
            name="desde"
            defaultValue={filtros.desde ?? ""}
            className="h-11 rounded-[var(--radius-md)] border border-line bg-paper px-3 text-step-0 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-line-strong"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="filtro-hasta"
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Hasta
          </label>
          <input
            id="filtro-hasta"
            type="date"
            name="hasta"
            defaultValue={filtros.hasta ?? ""}
            className="h-11 rounded-[var(--radius-md)] border border-line bg-paper px-3 text-step-0 text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-line-strong"
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit" variant="primary" className="w-full sm:w-auto">
            Filtrar
          </Button>
          {hayFiltros ? (
            <Button
              asChildLink
              href="/admin/pedidos"
              variant="ghost"
              className="w-full sm:w-auto"
            >
              Limpiar
            </Button>
          ) : null}
        </div>
      </form>

      {/* Results counter */}
      <p aria-live="polite" className="text-step--1 text-ink-soft">
        {hayResultados ? (
          <>
            Mostrando{" "}
            <span className="font-semibold text-ink tabular-nums">
              {pedidos.length}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-ink tabular-nums">
              {total.toLocaleString("es-HN")}
            </span>{" "}
            {total === 1 ? "pedido" : "pedidos"}
          </>
        ) : (
          <>Sin pedidos ({contador})</>
        )}
      </p>

      <DataTable
        caption="Lista de pedidos con número, cliente, total, estado y fecha"
        claveFila={(p) => p.id}
        columnas={columnas}
        filas={pedidos}
        vacio={
          <EmptyStateAdmin
            titulo={hayFiltros ? "Sin coincidencias" : "Aún no hay pedidos"}
            descripcion={
              hayFiltros
                ? "Ningún pedido coincide con estos filtros. Prueba a ampliarlos."
                : "Cuando entren pedidos aparecerán aquí."
            }
          >
            {hayFiltros ? (
              <Button asChildLink href="/admin/pedidos" variant="outline">
                Limpiar filtros
              </Button>
            ) : null}
          </EmptyStateAdmin>
        }
      />

      <PaginacionAdmin
        pagina={pagina}
        totalPaginas={totalPaginas}
        basePath="/admin/pedidos"
        paramsActuales={paramsActuales}
      />
    </div>
  );
}
