import type { Metadata } from "next";
import Image from "next/image";
import { ImageOff, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PageHeader,
  DataTable,
  EmptyStateAdmin,
  PaginacionAdmin,
  type ColumnaTabla,
} from "@/components/admin";
import { ProductosFiltros } from "@/components/admin/productos-filtros";
import { ProductosStockEditor } from "@/components/admin/productos-stock-editor";
import { ProductosDestacadoToggle } from "@/components/admin/productos-destacado-toggle";
import { ProductosAccionesFila } from "@/components/admin/productos-acciones-fila";
import {
  listarProductosAdmin,
  obtenerCategoriasAdmin,
  type ProductoFilaAdmin,
} from "@/server/admin/productos";
import { parsearFiltrosProductos } from "@/lib/validators/admin";
import { can, AuthError } from "@/lib/auth/guard";
import { formatearLempiras } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Productos",
};

/**
 * /admin/productos — product management (inventory + CRUD).
 *
 * Server Component. It reads the filters from searchParams (a Promise in Next 16)
 * with the TOTAL parser `parsearFiltrosProductos`, queries `listarProductosAdmin`
 * (requires "inventario:ver") and `obtenerCategoriasAdmin` for the selector, and
 * renders a DataTable with a thumbnail, data, inline stock editing (if the role can
 * adjust stock), a featured toggle (if it can edit) and a per-row actions
 * menu (edit / deactivate-reactivate / view in store).
 *
 * Permissions (UI gating; the hard barrier is in each server action):
 *  - "producto:crear"          => "Nuevo producto" button and Edit link.
 *  - "producto:editar"         => featured toggle.
 *  - "producto:desactivar"     => Deactivate/Reactivate action.
 *  - "inventario:ajustarStock" => inline stock editor.
 *
 * If the read throws AuthError (insufficient role despite the proxy), an
 * inline 403 with `error.mensajePublico` is shown.
 */
export default async function ProductosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filtros = parsearFiltrosProductos(sp);

  // Permissions for the UI gating (they are not the security barrier).
  const [puedeCrear, puedeEditar, puedeDesactivar, puedeAjustarStock] =
    await Promise.all([
      can("producto:crear"),
      can("producto:editar"),
      can("producto:desactivar"),
      can("inventario:ajustarStock"),
    ]);

  let datos: Awaited<ReturnType<typeof listarProductosAdmin>>;
  let categorias: Awaited<ReturnType<typeof obtenerCategoriasAdmin>>;
  try {
    [datos, categorias] = await Promise.all([
      listarProductosAdmin(filtros),
      obtenerCategoriasAdmin(),
    ]);
  } catch (error) {
    if (error instanceof AuthError) {
      return (
        <div className="flex flex-col gap-6">
          <PageHeader titulo="Productos" />
          <div
            role="alert"
            className="rounded-[var(--radius-lg)] border border-rose/40 bg-rose-50 px-5 py-4 text-step-0 text-ink"
          >
            {error.mensajePublico}
          </div>
        </div>
      );
    }
    throw error;
  }

  const { productos, total, pagina, totalPaginas } = datos;

  const hayFiltrosActivos =
    Boolean(filtros.q) ||
    Boolean(filtros.cat) ||
    filtros.estado !== "todos" ||
    filtros.orden !== "recientes";

  // Params (string) to preserve the filters in the pagination, without "page".
  const paramsActuales: Record<string, string> = {};
  if (filtros.q) paramsActuales.q = filtros.q;
  if (filtros.cat) paramsActuales.cat = filtros.cat;
  if (filtros.estado !== "todos") paramsActuales.estado = filtros.estado;
  if (filtros.orden !== "recientes") paramsActuales.orden = filtros.orden;

  const columnas: ColumnaTabla<ProductoFilaAdmin>[] = [
    {
      clave: "producto",
      encabezado: "Producto",
      render: (p) => <CeldaProducto producto={p} />,
    },
    {
      clave: "sku",
      encabezado: "SKU",
      render: (p) => (
        <span className="whitespace-nowrap font-mono text-step--1 text-ink-soft">{p.sku}</span>
      ),
    },
    {
      clave: "categoria",
      encabezado: "Categoría",
      render: (p) => <span className="text-ink-soft">{p.categoria}</span>,
    },
    {
      clave: "precio",
      encabezado: "Precio",
      alinear: "right",
      render: (p) => (
        <span className="tabular-nums font-medium">
          {formatearLempiras(p.precio)}
        </span>
      ),
    },
    {
      clave: "stock",
      encabezado: "Stock",
      alinear: "center",
      render: (p) =>
        puedeAjustarStock ? (
          <ProductosStockEditor
            id={p.id}
            nombre={p.nombre}
            stockInicial={p.stock}
          />
        ) : (
          <span className="tabular-nums font-semibold">{p.stock}</span>
        ),
    },
    {
      clave: "destacado",
      encabezado: "Destacado",
      alinear: "center",
      render: (p) =>
        puedeEditar ? (
          <ProductosDestacadoToggle
            id={p.id}
            nombre={p.nombre}
            destacadoInicial={p.destacado}
          />
        ) : p.destacado ? (
          <span className="text-step--1 font-medium text-amber">Sí</span>
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      clave: "activo",
      encabezado: "Estado",
      alinear: "center",
      render: (p) =>
        p.activo ? (
          <Badge variant="nuevo">Activo</Badge>
        ) : (
          <Badge variant="agotado">Inactivo</Badge>
        ),
    },
    {
      clave: "acciones",
      encabezado: <span className="sr-only">Acciones</span>,
      alinear: "right",
      render: (p) => (
        <ProductosAccionesFila
          id={p.id}
          nombre={p.nombre}
          slug={p.slug}
          activo={p.activo}
          puedeEditar={puedeEditar}
          puedeDesactivar={puedeDesactivar}
        />
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titulo="Productos"
        descripcion="Gestiona el catálogo: precios, stock, estado y destacados."
      >
        {puedeCrear ? (
          <Button asChildLink href="/admin/productos/nuevo" variant="primary">
            <PackagePlus aria-hidden="true" className="size-4.5" strokeWidth={2} />
            Nuevo producto
          </Button>
        ) : null}
      </PageHeader>

      <ProductosFiltros
        filtros={filtros}
        categorias={categorias}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-step--1 text-ink-faint" aria-live="polite">
          {total === 0
            ? "Sin productos"
            : `${total.toLocaleString("es-HN")} ${
                total === 1 ? "producto" : "productos"
              }`}
          {hayFiltrosActivos ? " (filtrados)" : ""}
        </p>
      </div>

      <DataTable
        caption="Lista de productos con su precio, stock, estado y acciones."
        claveFila={(p) => p.id}
        columnas={columnas}
        filas={productos}
        vacio={
          <EmptyStateAdmin
            titulo={
              hayFiltrosActivos
                ? "Sin resultados"
                : "Aún no hay productos"
            }
            descripcion={
              hayFiltrosActivos
                ? "Ningún producto coincide con estos filtros. Prueba a limpiarlos."
                : "Crea tu primer producto para empezar a vender."
            }
          >
            {hayFiltrosActivos ? (
              <Button asChildLink href="/admin/productos" variant="outline">
                Limpiar filtros
              </Button>
            ) : puedeCrear ? (
              <Button asChildLink href="/admin/productos/nuevo" variant="primary">
                <PackagePlus aria-hidden="true" className="size-4.5" strokeWidth={2} />
                Nuevo producto
              </Button>
            ) : null}
          </EmptyStateAdmin>
        }
      />

      <PaginacionAdmin
        pagina={pagina}
        totalPaginas={totalPaginas}
        basePath="/admin/productos"
        paramsActuales={paramsActuales}
      />
    </div>
  );
}

/* ── Composite cell: thumbnail + name + slug ──────────────────────────────── */

function CeldaProducto({ producto }: { producto: ProductoFilaAdmin }) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-2">
        {producto.imagen ? (
          <Image
            src={producto.imagen}
            alt=""
            fill
            sizes="44px"
            className="object-contain"
          />
        ) : (
          <ImageOff
            aria-hidden="true"
            className="size-5 text-ink-faint"
            strokeWidth={1.5}
          />
        )}
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="truncate font-medium text-ink">{producto.nombre}</span>
        <span className="truncate text-[0.78rem] text-ink-faint">
          /{producto.slug}
        </span>
      </div>
    </div>
  );
}
