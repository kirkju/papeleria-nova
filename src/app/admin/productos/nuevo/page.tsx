import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin";
import { ProductosForm } from "@/components/admin/productos-form";
import { obtenerCategoriasAdmin } from "@/server/admin/productos";
import { can, AuthError } from "@/lib/auth/guard";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

/**
 * /admin/productos/nuevo — product creation (ADMIN ONLY).
 *
 * HARD gating in the page: if the user does not hold "producto:crear", it redirects
 * to /no-autorizado BEFORE rendering (on top of the hard barrier already applied by
 * the `crearProducto` server action). It loads the categories for the form's
 * selector; the form (client island) calls `crearProducto`.
 */
export default async function NuevoProductoPage() {
  if (!(await can("producto:crear"))) redirect("/no-autorizado");

  let categorias: Awaited<ReturnType<typeof obtenerCategoriasAdmin>>;
  try {
    categorias = await obtenerCategoriasAdmin();
  } catch (error) {
    if (error instanceof AuthError) redirect("/no-autorizado");
    throw error;
  }

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
          titulo="Nuevo producto"
          descripcion="Completa los datos para añadir un producto al catálogo."
        />
      </div>

      <ProductosForm categorias={categorias} />
    </div>
  );
}
