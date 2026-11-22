import type { Metadata } from "next";
import { parsearFiltros } from "@/lib/validators/catalogo";
import {
  obtenerProductosCatalogo,
  obtenerCategoriasFiltro,
  obtenerMarcasFiltro,
} from "@/server/catalogo";
import { ProductCard } from "@/components/storefront/product-card";
import {
  FiltrosCatalogo,
  OrdenSelect,
} from "@/components/storefront/filtros-catalogo";
import { PaginacionCatalogo } from "@/components/storefront/paginacion-catalogo";
import { EstadoVacio } from "@/components/storefront/estado-vacio";
import { Button } from "@/components/ui/button";

/**
 * Catalog page — dynamic Server Component.
 *
 * The URL is the source of truth: `parsearFiltros` normalizes the
 * searchParams (q/cat/marca/min/max/disp/sort/page) and the data layer
 * queries Prisma (active products only). The state of the filters lives in the
 * sidebar (client) and is reflected in the URL so that it is shareable and
 * SEO-friendly.
 *
 * It is dynamic: `searchParams` is a Promise in Next 16 and the queries depend
 * on it, so it is not prerendered at build time (it does not touch the DB when compiling).
 */
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

/** Base URL of the site for consistent absolute canonicals. */
const SITIO = "https://papeleria-nova.example";

/** Takes the first value of a searchParam (it can come repeated as an array). */
function primerValor(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

/* ── Dynamic metadata ───────────────────────────────────────────────────────── */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const filtros = parsearFiltros(sp);

  // Readable name of the category (if the slug exists in the active catalog).
  let nombreCategoria: string | undefined;
  if (filtros.cat) {
    const cats = await obtenerCategoriasFiltro();
    nombreCategoria = cats.find((c) => c.slug === filtros.cat)?.nombre;
  }

  // Title: category > search > generic.
  let title: string;
  let description: string;
  if (filtros.q) {
    title = `Resultados para “${filtros.q}”`;
    description = `Resultados de búsqueda para “${filtros.q}” en Papelería Nova. Útiles escolares y de oficina con envío a todo Honduras. Precios en Lempiras.`;
  } else if (nombreCategoria) {
    title = `${nombreCategoria} — Catálogo`;
    description = `Explora ${nombreCategoria.toLowerCase()} en Papelería Nova: útiles seleccionados con cariño, envío a todo Honduras y precios en Lempiras.`;
  } else {
    title = "Catálogo de útiles";
    description =
      "Catálogo de útiles escolares y de oficina de Papelería Nova: cuadernos, escritura, arte, mochilas y más. Envío a todo Honduras. Precios en Lempiras.";
  }

  // Canonical: /catalogo, or /catalogo?cat=slug when there is ONLY a category.
  const soloCategoria =
    filtros.cat &&
    !filtros.q &&
    !filtros.marca &&
    filtros.min === undefined &&
    filtros.max === undefined &&
    !filtros.disp &&
    filtros.sort === "relevancia" &&
    filtros.page === 1;
  const canonical = soloCategoria
    ? `/catalogo?cat=${encodeURIComponent(filtros.cat as string)}`
    : "/catalogo";

  // Searches and paginated pages add no unique indexable content:
  // noindex,follow (per the project's SEO convention: canonical on pages with
  // filters to avoid duplicates).
  const noIndexar = Boolean(filtros.q) || filtros.page > 1;

  return {
    title,
    description,
    alternates: { canonical },
    robots: noIndexar ? { index: false, follow: true } : undefined,
    openGraph: {
      title: `${title} · Papelería Nova`,
      description,
      url: `${SITIO}${canonical}`,
      type: "website",
    },
  };
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filtros = parsearFiltros(sp);

  const [{ productos, total, pagina, totalPaginas }, categorias, marcas] =
    await Promise.all([
      obtenerProductosCatalogo(filtros),
      obtenerCategoriasFiltro(),
      obtenerMarcasFiltro(),
    ]);

  // Dynamic H1: chosen category > search > generic.
  const nombreCategoria =
    filtros.cat !== undefined
      ? categorias.find((c) => c.slug === filtros.cat)?.nombre
      : undefined;
  let titulo: string;
  if (nombreCategoria) titulo = nombreCategoria;
  else if (filtros.q) titulo = `Resultados para “${filtros.q}”`;
  else titulo = "Catálogo";

  const hayResultados = productos.length > 0;
  const contador =
    total === 1 ? "1 producto" : `${total.toLocaleString("es-HN")} productos`;

  // Current params (strings only) to preserve in the pagination.
  const paramsActuales = Object.fromEntries(
    Object.entries(sp).flatMap(([clave, valor]) => {
      const v = primerValor(valor);
      return v !== undefined && v !== "" ? [[clave, v]] : [];
    }),
  ) as Record<string, string>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-12 lg:py-12">
      {/* Header */}
      <header className="mb-6">
        <p className="font-display text-[0.85rem] font-medium uppercase tracking-wide text-ink-faint">
          Papelería Nova
        </p>
        <h1 className="mt-1 font-display text-step-3 font-semibold text-ink">
          {titulo}
        </h1>
        <p className="mt-1 text-ink-soft">
          {hayResultados
            ? `${contador} para llenar tu lista.`
            : "Ajusta tu búsqueda para encontrar útiles."}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:gap-10">
        {/* Filter sidebar: sticky at lg+, drawer on mobile (internal) */}
        <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Filtros">
          <FiltrosCatalogo categorias={categorias} marcas={marcas} />
        </aside>

        {/* Results column */}
        <section aria-label="Resultados del catálogo">
          {/* Top bar: counter + sort order */}
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p
              aria-live="polite"
              className="text-[0.9rem] font-medium text-ink-soft"
            >
              {hayResultados ? (
                <>
                  Mostrando{" "}
                  <span className="font-semibold text-ink tabular-nums">
                    {productos.length}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-ink tabular-nums">
                    {total.toLocaleString("es-HN")}
                  </span>{" "}
                  {total === 1 ? "producto" : "productos"}
                </>
              ) : (
                "Sin resultados"
              )}
            </p>
            <OrdenSelect className="sm:w-72" />
          </div>

          {hayResultados ? (
            <>
              <ul
                role="list"
                className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4"
              >
                {productos.map((p) => (
                  <li key={p.id}>
                    <ProductCard producto={p} />
                  </li>
                ))}
              </ul>

              {totalPaginas > 1 && (
                <div className="mt-10">
                  <PaginacionCatalogo
                    pagina={pagina}
                    totalPaginas={totalPaginas}
                    paramsActuales={paramsActuales}
                  />
                </div>
              )}
            </>
          ) : (
            <EstadoVacio
              titulo="No encontramos útiles con esos filtros"
              descripcion={
                filtros.q
                  ? `No hay resultados para “${filtros.q}”. Prueba con otra palabra (por nombre, marca o SKU), revisa la ortografía o quita algunos filtros.`
                  : "Prueba con un rango de precios más amplio, otra categoría o quita algunos filtros para ver más productos."
              }
            >
              <Button asChildLink href="/catalogo" variant="accent" size="md">
                Ver todo el catálogo
              </Button>
            </EstadoVacio>
          )}
        </section>
      </div>
    </div>
  );
}
