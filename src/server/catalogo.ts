/**
 * Catalog data layer (READ-ONLY, for Server Components).
 *
 * Golden rules of this module:
 * - PUBLIC catalog: guests browse it. It requires no authorization, but ONLY
 *   products with `activo: true` are exposed.
 * - ALWAYS EXPLICIT `select`/`include`: `passwordHash` and other sensitive
 *   fields are never leaked in the responses.
 * - Prisma `Decimal` is NOT serializable to Client Components: it is converted to
 *   `number` here, at the data boundary. Dates are returned as ISO.
 *
 * URL/filter contract: see `@/lib/validators/catalogo`.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  TAMANO_PAGINA,
  type FiltrosCatalogo,
} from "@/lib/validators/catalogo";

// ── Output types (serializable, no Decimal or Date) ──────────────────────────

export type ProductoCard = {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  comparePrice: number | null;
  imagen: { url: string; alt: string } | null;
  marca: string | null;
  stock: number;
  sku: string;
  destacado: boolean;
  creadoEn: string; // ISO
  categoria: { nombre: string; slug: string };
};

export type ProductoFicha = ProductoCard & {
  descripcion: string;
  imagenes: { url: string; alt: string }[];
  rating: { promedio: number; total: number } | null;
  reviews: {
    id: string;
    rating: number;
    comentario: string | null;
    autor: string;
    fecha: string; // ISO
  }[];
};

export type ResultadoCatalogo = {
  productos: ProductoCard[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

export type CategoriaFiltro = {
  nombre: string;
  slug: string;
  conteo: number;
};

// ── Reusable selects (explicit fields) ───────────────────────────────────────

const SELECT_CARD = {
  id: true,
  slug: true,
  nombre: true,
  precio: true,
  comparePrice: true,
  marca: true,
  stock: true,
  sku: true,
  destacado: true,
  createdAt: true,
  category: { select: { nombre: true, slug: true } },
  images: {
    select: { url: true, alt: true },
    orderBy: { orden: "asc" },
    take: 1,
  },
} satisfies Prisma.ProductSelect;

type ProductoCardRow = Prisma.ProductGetPayload<{ select: typeof SELECT_CARD }>;

// ── Mappers: Prisma -> serializable types ────────────────────────────────────

function mapearImagen(
  img: { url: string; alt: string | null } | undefined,
): { url: string; alt: string } | null {
  if (!img) return null;
  // `alt` can be null in the DB; we fall back to an empty string so next/image does not break.
  return { url: img.url, alt: img.alt ?? "" };
}

function mapearCard(p: ProductoCardRow): ProductoCard {
  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    precio: Number(p.precio),
    comparePrice: p.comparePrice === null ? null : Number(p.comparePrice),
    imagen: mapearImagen(p.images[0]),
    marca: p.marca,
    stock: p.stock,
    sku: p.sku,
    destacado: p.destacado,
    creadoEn: p.createdAt.toISOString(),
    categoria: { nombre: p.category.nombre, slug: p.category.slug },
  };
}

// ── WHERE and ORDER BY from the filters ──────────────────────────────────────

function construirWhere(f: FiltrosCatalogo): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = { activo: true };

  if (f.q) {
    // Search in nombre/descripcion/sku/marca, case-insensitive.
    where.OR = [
      { nombre: { contains: f.q, mode: "insensitive" } },
      { descripcion: { contains: f.q, mode: "insensitive" } },
      { sku: { contains: f.q, mode: "insensitive" } },
      { marca: { contains: f.q, mode: "insensitive" } },
    ];
  }

  if (f.cat) {
    where.category = { slug: f.cat };
  }

  if (f.marca) {
    // insensitive: shared/hand-typed URLs (?marca=stabilo)
    // must find the same as the brand select.
    where.marca = { equals: f.marca, mode: "insensitive" };
  }

  if (f.min !== undefined || f.max !== undefined) {
    const precio: Prisma.DecimalFilter = {};
    if (f.min !== undefined) precio.gte = f.min;
    if (f.max !== undefined) precio.lte = f.max;
    where.precio = precio;
  }

  if (f.disp) {
    where.stock = { gt: 0 };
  }

  return where;
}

function construirOrderBy(
  sort: FiltrosCatalogo["sort"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "precio_asc":
      return [{ precio: "asc" }];
    case "precio_desc":
      return [{ precio: "desc" }];
    case "nuevos":
      return [{ createdAt: "desc" }];
    case "relevancia":
    default:
      // Featured first, then the most recent.
      return [{ destacado: "desc" }, { createdAt: "desc" }];
  }
}

// ── Public queries ───────────────────────────────────────────────────────────

/**
 * Paginated list of catalog products per the filters (the URL is the source of
 * truth). Active products only. `totalPaginas` is at least 1.
 *
 * If `page` exceeds `totalPaginas`, an empty list is returned but with the
 * REAL `totalPaginas` (the UI shows the empty state and can offer going back to
 * the first page).
 */
export async function obtenerProductosCatalogo(
  filtros: FiltrosCatalogo,
): Promise<ResultadoCatalogo> {
  const where = construirWhere(filtros);
  const orderBy = construirOrderBy(filtros.sort);
  const take = TAMANO_PAGINA;
  const skip = (filtros.page - 1) * take;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take, skip, select: SELECT_CARD }),
    prisma.product.count({ where }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / take));

  return {
    productos: rows.map(mapearCard),
    total,
    pagina: filtros.page,
    totalPaginas,
  };
}

/**
 * Categories for the filters panel, with the count of ACTIVE products, in
 * alphabetical order. Decision: categories with a count of 0 are EXCLUDED (they
 * add nothing to the filter, only noise). If all of them should be shown in the
 * future, just remove the `.filter(...)`.
 */
export async function obtenerCategoriasFiltro(): Promise<CategoriaFiltro[]> {
  const categorias = await prisma.category.findMany({
    select: {
      nombre: true,
      slug: true,
      _count: { select: { productos: { where: { activo: true } } } },
    },
    orderBy: { nombre: "asc" },
  });

  return categorias
    .map((c) => ({ nombre: c.nombre, slug: c.slug, conteo: c._count.productos }))
    .filter((c) => c.conteo > 0);
}

/**
 * Distinct (non-null) brands of active products, sorted alphabetically.
 * Useful for the catalog's brand filter.
 */
export async function obtenerMarcasFiltro(): Promise<string[]> {
  const filas = await prisma.product.findMany({
    where: { activo: true, marca: { not: null } },
    select: { marca: true },
    distinct: ["marca"],
    orderBy: { marca: "asc" },
  });

  // `marca` is `string | null` in the type; the where already excludes null, so the
  // filtering here is only for type safety.
  return filas
    .map((f) => f.marca)
    .filter((m): m is string => m !== null);
}

/**
 * Full detail of a product by slug. Only if it is active (if it does not exist
 * or is inactive it returns null). Images sorted by `orden`. The reviews
 * include the author's name (EXPLICIT select: never passwordHash). The
 * `promedio` uses 1-decimal rounding; `rating` is null if there are no reviews.
 */
export async function obtenerProductoPorSlug(
  slug: string,
): Promise<ProductoFicha | null> {
  const p = await prisma.product.findFirst({
    where: { slug, activo: true },
    select: {
      ...SELECT_CARD,
      descripcion: true,
      // All the images, sorted (not just the first one).
      images: {
        select: { url: true, alt: true },
        orderBy: { orden: "asc" },
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comentario: true,
          createdAt: true,
          // ONLY the author's name; never email/passwordHash.
          user: { select: { nombre: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!p) return null;

  const imagenes = p.images.map((img) => ({
    url: img.url,
    alt: img.alt ?? "",
  }));

  const totalReviews = p.reviews.length;
  const rating =
    totalReviews > 0
      ? {
          promedio:
            Math.round(
              (p.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews) *
                10,
            ) / 10,
          total: totalReviews,
        }
      : null;

  return {
    id: p.id,
    slug: p.slug,
    nombre: p.nombre,
    precio: Number(p.precio),
    comparePrice: p.comparePrice === null ? null : Number(p.comparePrice),
    imagen: imagenes[0] ?? null,
    marca: p.marca,
    stock: p.stock,
    sku: p.sku,
    destacado: p.destacado,
    creadoEn: p.createdAt.toISOString(),
    categoria: { nombre: p.category.nombre, slug: p.category.slug },
    descripcion: p.descripcion,
    imagenes,
    rating,
    reviews: p.reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comentario: r.comentario,
      autor: r.user.nombre,
      fecha: r.createdAt.toISOString(),
    })),
  };
}

/**
 * Related products: same category, active, excluding the current
 * product. Order: featured first, then most recent. Limited to `limite`.
 */
export async function obtenerRelacionados(
  categoriaSlug: string,
  excluirId: string,
  limite = 4,
): Promise<ProductoCard[]> {
  const rows = await prisma.product.findMany({
    where: {
      activo: true,
      category: { slug: categoriaSlug },
      id: { not: excluirId },
    },
    orderBy: [{ destacado: "desc" }, { createdAt: "desc" }],
    take: limite,
    select: SELECT_CARD,
  });

  return rows.map(mapearCard);
}
