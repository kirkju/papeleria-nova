import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin";
import { ProductosForm } from "@/components/admin/productos-form";
import {
  obtenerProductoAdmin,
  obtenerCategoriasAdmin,
} from "@/server/admin/productos";
import { can, AuthError } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Editar producto",
};

/**
 * /admin/productos/[id]/editar — product editing (ADMIN ONLY).
 *
 * HARD gating: if the user does not hold "producto:editar", it redirects to
 * /no-autorizado BEFORE rendering (on top of the barrier in `actualizarProducto`).
 * It loads the product with `obtenerProductoAdmin` (notFound if it does not
 * exist) and the categories for the selector. The preloaded form (client island)
 * calls `actualizarProducto(id, ...)`.
 *
 * Next 16: `params` is a Promise (await). An INACTIVE product can also be
 * edited (and reactivated from here or from the list).
 */
export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await can("producto:editar"))) redirect("/no-autorizado");

  const { id } = await params;

  let producto: Awaited<ReturnType<typeof obtenerProductoAdmin>>;
  let categorias: Awaited<ReturnType<typeof obtenerCategoriasAdmin>>;
  try {
    [producto, categorias] = await Promise.all([
      obtenerProductoAdmin(id),
      obtenerCategoriasAdmin(),
    ]);
  } catch (error) {
    if (error instanceof AuthError) redirect("/no-autorizado");
    throw error;
  }

  if (!producto) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <a
          href="/admin/productos"
          className="inline-flex w-fit items-center gap-1.5 text-step--1 font-medium text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
          Volver a productos
        </a>
        <PageHeader
          titulo="Editar producto"
          descripcion={producto.nombre}
        />
      </div>

      <ProductosForm categorias={categorias} producto={producto} />
    </div>
  );
}
