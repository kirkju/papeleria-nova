"use server";

/**
 * Admin PRODUCT server actions — inventory + CRUD.
 *
 * Golden rules of this module (non-negotiable):
 * - Authorization ALWAYS on the server, with the exact permission of each action:
 *     list/read    -> "inventario:ver"          (VENDEDOR|ADMIN)
 *     adjust stock -> "inventario:ajustarStock" (VENDEDOR|ADMIN)
 *     create       -> "producto:crear"          (ADMIN ONLY)
 *     edit         -> "producto:editar"         (ADMIN ONLY)
 *     activate/deactivate -> "producto:desactivar" (ADMIN ONLY)
 *   `assertCan` throws `AuthError`; it is caught at the boundary -> { ok:false, error }.
 * - ALWAYS A SOFT DELETE: never a hard delete; `activo` is toggled.
 * - `Decimal` does not cross to the client: rows/DTOs return `number`; dates,
 *   ISO. Explicit `select`.
 * - Money is persisted as `Prisma.Decimal` from the validated string.
 * - slug/sku uniqueness: the write is attempted and, on collision (P2002), a
 *   clear message is returned stating WHICH field collided.
 * - After EVERY mutation /admin/productos, /catalogo and, where applicable, the
 *   /producto/[slug] of the affected product are revalidated.
 */
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { assertCan, AuthError } from "@/lib/auth/guard";
import {
  parsearProducto,
  type ProductoValidado,
} from "@/lib/validators/producto";
import {
  TAMANO_PAGINA_ADMIN,
  UMBRAL_STOCK_BAJO,
  type FiltrosProductosAdmin,
} from "@/lib/validators/admin";

// ── Output types (serializable) ───────────────────────────────────────────────

/** Row of the admin products DataTable (serializable). */
export type ProductoFilaAdmin = {
  id: string;
  nombre: string;
  slug: string;
  sku: string;
  precio: number;
  stock: number;
  activo: boolean;
  destacado: boolean;
  categoria: string;
  /** URL of the first image, or null if it has none. */
  imagen: string | null;
};

export type ResultadoListaProductos = {
  productos: ProductoFilaAdmin[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

/** Detail of a product for the edit form (serializable). */
export type ProductoDetalleAdmin = {
  id: string;
  nombre: string;
  slug: string;
  descripcion: string;
  precio: number;
  comparePrice: number | null;
  sku: string;
  stock: number;
  marca: string | null;
  activo: boolean;
  destacado: boolean;
  categoryId: string;
  /** URL of the first image, or null. */
  imagenUrl: string | null;
};

/** Category option for the admin selects. */
export type CategoriaOpcion = { id: string; nombre: string; slug: string };

/** Uniform result of the mutations. */
export type ResultadoMutacion =
  | { ok: true; id: string }
  | { ok: false; error: string };

// ── Messages (Spanish, without leaking technical detail) ─────────────────────

const ERROR_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";
const ERROR_NO_ENCONTRADO = "No encontramos ese producto.";
const ERROR_SLUG_DUP = "Ya existe un producto con ese slug. Cambia el slug.";
const ERROR_SKU_DUP = "Ya existe un producto con ese SKU. Usa otro SKU.";
const ERROR_CATEGORIA = "La categoría seleccionada no existe.";

// ── Internal helpers ──────────────────────────────────────────────────────────

/** Turns an `AuthError` into a result; rethrows any other error. */
function falloAuth(error: unknown): ResultadoMutacion | null {
  if (error instanceof AuthError) return { ok: false, error: error.mensajePublico };
  return null;
}

/**
 * Translates a P2002 (unique index collision) into the message of the field that
 * collided. `target` may list "slug" or "sku". If it cannot be told, generic message.
 */
function mensajeColisionUnica(error: Prisma.PrismaClientKnownRequestError): string {
  const target = error.meta?.target;
  const campos = Array.isArray(target)
    ? target.map(String)
    : typeof target === "string"
      ? [target]
      : [];
  if (campos.some((c) => c.includes("slug"))) return ERROR_SLUG_DUP;
  if (campos.some((c) => c.includes("sku"))) return ERROR_SKU_DUP;
  return "Ya existe un producto con esos datos únicos.";
}

/** Builds the WHERE of the products DataTable from the filters. */
function construirWhereAdmin(
  f: FiltrosProductosAdmin,
): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};

  if (f.q) {
    where.OR = [
      { nombre: { contains: f.q, mode: "insensitive" } },
      { sku: { contains: f.q, mode: "insensitive" } },
      { marca: { contains: f.q, mode: "insensitive" } },
    ];
  }

  if (f.cat) {
    // Accepts a category slug (what travels in the URL).
    where.category = { slug: f.cat };
  }

  switch (f.estado) {
    case "activos":
      where.activo = true;
      break;
    case "inactivos":
      where.activo = false;
      break;
    case "stock-bajo":
      // Low stock among the ACTIVE ones (inactive products are not restocked).
      where.activo = true;
      where.stock = { lte: UMBRAL_STOCK_BAJO };
      break;
    case "todos":
    default:
      break;
  }

  return where;
}

/** ORDER BY of the products table. */
function construirOrderByAdmin(
  orden: FiltrosProductosAdmin["orden"],
): Prisma.ProductOrderByWithRelationInput[] {
  switch (orden) {
    case "nombre":
      return [{ nombre: "asc" }];
    case "precio":
      return [{ precio: "desc" }];
    case "stock":
      return [{ stock: "asc" }];
    case "recientes":
    default:
      return [{ createdAt: "desc" }];
  }
}

// ── READ: paginated list ─────────────────────────────────────────────────────

/**
 * Paginated list of products for the admin (12/page). Requires "inventario:ver".
 * Includes ACTIVE and INACTIVE products (unlike the public catalog).
 * `totalPaginas` is at least 1. If `page` exceeds the total, an empty list with
 * the real `totalPaginas`.
 *
 * Throws `AuthError` if the role falls short (the page catches it -> 403). It is
 * not wrapped in { ok } because it is a Server Component READ.
 */
export async function listarProductosAdmin(
  filtros: FiltrosProductosAdmin,
): Promise<ResultadoListaProductos> {
  await assertCan("inventario:ver");

  const where = construirWhereAdmin(filtros);
  const orderBy = construirOrderByAdmin(filtros.orden);
  const take = TAMANO_PAGINA_ADMIN;
  const skip = (filtros.page - 1) * take;

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take,
      skip,
      select: {
        id: true,
        nombre: true,
        slug: true,
        sku: true,
        precio: true,
        stock: true,
        activo: true,
        destacado: true,
        category: { select: { nombre: true } },
        images: {
          select: { url: true },
          orderBy: { orden: "asc" },
          take: 1,
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  const totalPaginas = Math.max(1, Math.ceil(total / take));

  return {
    productos: rows.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      slug: p.slug,
      sku: p.sku,
      precio: Number(p.precio),
      stock: p.stock,
      activo: p.activo,
      destacado: p.destacado,
      categoria: p.category.nombre,
      imagen: p.images[0]?.url ?? null,
    })),
    total,
    pagina: filtros.page,
    totalPaginas,
  };
}

/**
 * Detail of a product by id for the edit form. Requires
 * "inventario:ver". Returns null if it does not exist (active or not).
 */
export async function obtenerProductoAdmin(
  id: string,
): Promise<ProductoDetalleAdmin | null> {
  await assertCan("inventario:ver");

  const p = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      slug: true,
      descripcion: true,
      precio: true,
      comparePrice: true,
      sku: true,
      stock: true,
      marca: true,
      activo: true,
      destacado: true,
      categoryId: true,
      images: {
        select: { url: true },
        orderBy: { orden: "asc" },
        take: 1,
      },
    },
  });

  if (!p) return null;

  return {
    id: p.id,
    nombre: p.nombre,
    slug: p.slug,
    descripcion: p.descripcion,
    precio: Number(p.precio),
    comparePrice: p.comparePrice === null ? null : Number(p.comparePrice),
    sku: p.sku,
    stock: p.stock,
    marca: p.marca,
    activo: p.activo,
    destacado: p.destacado,
    categoryId: p.categoryId,
    imagenUrl: p.images[0]?.url ?? null,
  };
}

/**
 * Categories for the selector of the product form. Requires
 * "inventario:ver". Alphabetical order.
 */
export async function obtenerCategoriasAdmin(): Promise<CategoriaOpcion[]> {
  await assertCan("inventario:ver");

  const categorias = await prisma.category.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, slug: true },
  });

  return categorias;
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────

/** Revalidates the routes affected by a product mutation. */
function revalidarProducto(slug?: string): void {
  revalidatePath("/admin/productos");
  revalidatePath("/catalogo");
  if (slug) revalidatePath(`/producto/${slug}`);
}

/**
 * Builds the block of Prisma data common to create/update from a validated
 * product. The slug arrives already resolved (never empty).
 */
function datosProducto(
  data: ProductoValidado,
): Prisma.ProductUncheckedCreateInput {
  return {
    nombre: data.nombre,
    slug: data.slug,
    descripcion: data.descripcion,
    precio: new Prisma.Decimal(data.precio),
    comparePrice:
      data.comparePrice !== undefined
        ? new Prisma.Decimal(data.comparePrice)
        : null,
    sku: data.sku,
    stock: data.stock,
    marca: data.marca ?? null,
    activo: data.activo,
    destacado: data.destacado,
    categoryId: data.categoryId,
  };
}

/**
 * Creates a product. Requires "producto:crear" (ADMIN ONLY).
 * - Validates the FormData (slug derived from the name if it comes empty).
 * - Checks that the category exists (clear message if not).
 * - If `imagenUrl` is present, creates the product's first image.
 * - slug/sku collision -> field-specific message.
 */
export async function crearProducto(
  formData: FormData,
): Promise<ResultadoMutacion> {
  try {
    await assertCan("producto:crear");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  const parsed = parsearProducto(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;

  // The category must exist (FK Restrict; a clear message before the insert is better).
  const categoria = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!categoria) return { ok: false, error: ERROR_CATEGORIA };

  try {
    const creado = await prisma.product.create({
      data: {
        ...datosProducto(data),
        ...(data.imagenUrl
          ? {
              images: {
                create: { url: data.imagenUrl, alt: data.nombre, orden: 0 },
              },
            }
          : {}),
      },
      select: { id: true, slug: true },
    });

    revalidarProducto(creado.slug);
    return { ok: true, id: creado.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: mensajeColisionUnica(error) };
    }
    console.error("[admin/productos] crearProducto:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Updates a product. Requires "producto:editar" (ADMIN ONLY).
 * - Validates the FormData. Checks that the product and the category exist.
 * - Handles the first image via UPSERT: if `imagenUrl` is present, it updates the
 *   image at orden 0 (or creates it); if it is not, the images are NOT touched
 *   (nothing is deleted).
 * - Revalidates the route of the PREVIOUS slug and of the NEW one (if it changed).
 */
export async function actualizarProducto(
  id: string,
  formData: FormData,
): Promise<ResultadoMutacion> {
  try {
    await assertCan("producto:editar");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  const parsed = parsearProducto(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const data = parsed.data;

  const existente = await prisma.product.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!existente) return { ok: false, error: ERROR_NO_ENCONTRADO };

  const categoria = await prisma.category.findUnique({
    where: { id: data.categoryId },
    select: { id: true },
  });
  if (!categoria) return { ok: false, error: ERROR_CATEGORIA };

  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: datosProducto(data),
      });

      // Upsert of the FIRST image (orden 0). If imagenUrl is missing, the
      // existing images are not touched.
      if (data.imagenUrl) {
        const primera = await tx.productImage.findFirst({
          where: { productId: id },
          orderBy: { orden: "asc" },
          select: { id: true },
        });
        if (primera) {
          await tx.productImage.update({
            where: { id: primera.id },
            data: { url: data.imagenUrl, alt: data.nombre },
          });
        } else {
          await tx.productImage.create({
            data: { productId: id, url: data.imagenUrl, alt: data.nombre, orden: 0 },
          });
        }
      }
    });

    revalidarProducto(existente.slug);
    if (data.slug !== existente.slug) revalidarProducto(data.slug);
    return { ok: true, id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: mensajeColisionUnica(error) };
    }
    console.error("[admin/productos] actualizarProducto:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/** Shared helper for deactivating/reactivating (soft delete). */
async function cambiarActivo(
  id: string,
  activo: boolean,
): Promise<ResultadoMutacion> {
  try {
    await assertCan("producto:desactivar");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  try {
    const actualizado = await prisma.product.update({
      where: { id },
      data: { activo },
      select: { id: true, slug: true },
    });
    revalidarProducto(actualizado.slug);
    return { ok: true, id: actualizado.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: ERROR_NO_ENCONTRADO };
    }
    console.error("[admin/productos] cambiarActivo:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Deactivates a product (SOFT delete). Requires "producto:desactivar".
 * The product stops showing in the public catalog but keeps its history.
 */
export async function desactivarProducto(id: string): Promise<ResultadoMutacion> {
  return cambiarActivo(id, false);
}

/**
 * Reactivates a previously deactivated product. Requires "producto:desactivar".
 */
export async function reactivarProducto(id: string): Promise<ResultadoMutacion> {
  return cambiarActivo(id, true);
}

/**
 * Sets a product's stock to an absolute value. Requires
 * "inventario:ajustarStock". `stock` must be an integer >= 0.
 */
export async function ajustarStock(
  id: string,
  stock: number,
): Promise<ResultadoMutacion> {
  try {
    await assertCan("inventario:ajustarStock");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  if (!Number.isInteger(stock) || stock < 0) {
    return { ok: false, error: "El stock debe ser un número entero mayor o igual a 0." };
  }

  try {
    const actualizado = await prisma.product.update({
      where: { id },
      data: { stock },
      select: { id: true, slug: true },
    });
    revalidarProducto(actualizado.slug);
    return { ok: true, id: actualizado.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { ok: false, error: ERROR_NO_ENCONTRADO };
    }
    console.error("[admin/productos] ajustarStock:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}

/**
 * Toggles a product's "destacado" (featured) flag. Requires "producto:editar".
 * Reads the current value and inverts it in a transaction to avoid races.
 */
export async function alternarDestacado(id: string): Promise<ResultadoMutacion> {
  try {
    await assertCan("producto:editar");
  } catch (error) {
    const fallo = falloAuth(error);
    if (fallo) return fallo;
    throw error;
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const actual = await tx.product.findUnique({
        where: { id },
        select: { destacado: true },
      });
      if (!actual) return null;
      return tx.product.update({
        where: { id },
        data: { destacado: !actual.destacado },
        select: { id: true, slug: true },
      });
    });

    if (!resultado) return { ok: false, error: ERROR_NO_ENCONTRADO };
    revalidarProducto(resultado.slug);
    return { ok: true, id: resultado.id };
  } catch (error) {
    console.error("[admin/productos] alternarDestacado:", error);
    return { ok: false, error: ERROR_GENERICO };
  }
}
