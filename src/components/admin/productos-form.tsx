"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, ImageOff, Save } from "lucide-react";
import {
  crearProducto,
  actualizarProducto,
  type CategoriaOpcion,
  type ProductoDetalleAdmin,
} from "@/server/admin/productos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * ProductosForm — create/edit product form (client island).
 *
 * CREATE mode (no `producto`): calls `crearProducto` ("producto:crear").
 * EDIT mode (with `producto`): calls `actualizarProducto(id, ...)`
 * ("producto:editar"). The hard barrier lives in each server action; the page
 * also redirects, before rendering, if the user lacks the permission.
 *
 * It uses useActionState over a wrapper of the mutation that returns
 * `{ ok: true, id } | { ok: false, error }`. On success it navigates to
 * /admin/productos with router.push + router.refresh. On error it renders a
 * role="alert" banner and moves focus to it. The form's `name`s match EXACTLY the
 * contract of `parsearProducto`. Double submits are prevented with the `enviando` state.
 */

const ESTADO_INICIAL = { error: null as string | null };

export function ProductosForm({
  categorias,
  producto,
}: {
  categorias: CategoriaOpcion[];
  /** If present, the form edits that product; otherwise it creates a new one. */
  producto?: ProductoDetalleAdmin;
}) {
  const router = useRouter();
  const esEdicion = producto !== undefined;
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // Image preview: it starts from the existing image (when editing).
  const [imagenUrl, setImagenUrl] = React.useState(producto?.imagenUrl ?? "");

  const accion = React.useCallback(
    async (
      _previo: typeof ESTADO_INICIAL,
      formData: FormData,
    ): Promise<typeof ESTADO_INICIAL> => {
      const resultado = esEdicion
        ? await actualizarProducto(producto.id, formData)
        : await crearProducto(formData);

      if (resultado.ok) {
        router.push("/admin/productos");
        router.refresh();
        return { error: null };
      }
      return { error: resultado.error };
    },
    [esEdicion, producto, router],
  );

  const [estado, formAction, enviando] = React.useActionState(
    accion,
    ESTADO_INICIAL,
  );

  React.useEffect(() => {
    if (estado.error) {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus();
    }
  }, [estado.error]);

  const previsualizable = imagenUrl.trim().startsWith("/");

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {estado.error ? (
        <div
          ref={bannerRef}
          role="alert"
          tabIndex={-1}
          className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-rose/40 bg-rose-50 px-4 py-3.5 text-step-0 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-rose"
            strokeWidth={2}
          />
          <div>
            <p className="font-semibold text-rose">
              No se pudo guardar el producto
            </p>
            <p className="mt-0.5 text-ink-soft">{estado.error}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        {/* Main column: product data */}
        <div className="flex flex-col gap-6">
          <Seccion titulo="Información general">
            <Input
              name="nombre"
              label="Nombre *"
              required
              maxLength={120}
              defaultValue={producto?.nombre}
              placeholder="Cuaderno profesional 100 hojas"
            />
            <Input
              name="slug"
              label="Slug"
              defaultValue={producto?.slug}
              hint="Se genera del nombre si lo dejas vacío. Solo minúsculas, números y guiones."
              placeholder="cuaderno-profesional-100-hojas"
            />
            <CampoTextarea
              name="descripcion"
              label="Descripción *"
              required
              defaultValue={producto?.descripcion}
              hint="Mínimo 10 caracteres."
              placeholder="Describe el producto: materiales, medidas, usos…"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                name="sku"
                label="SKU *"
                required
                maxLength={40}
                defaultValue={producto?.sku}
                placeholder="CUA-PRO-100"
              />
              <Input
                name="marca"
                label="Marca"
                maxLength={80}
                defaultValue={producto?.marca ?? ""}
                placeholder="Norma"
              />
            </div>
          </Seccion>

          <Seccion titulo="Precio e inventario">
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoPrecio
                name="precio"
                label="Precio *"
                required
                defaultValue={producto ? String(producto.precio) : ""}
              />
              <CampoPrecio
                name="comparePrice"
                label="Precio de comparación"
                defaultValue={
                  producto?.comparePrice != null
                    ? String(producto.comparePrice)
                    : ""
                }
                hint="Precio tachado “antes”. Debe ser mayor al precio."
              />
            </div>
            <div className="sm:max-w-[12rem]">
              <Input
                name="stock"
                label="Stock *"
                required
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={producto ? String(producto.stock) : "0"}
              />
            </div>
          </Seccion>
        </div>

        {/* Side column: organization, image, status */}
        <div className="flex flex-col gap-6">
          <Seccion titulo="Organización">
            <CampoSelect
              name="categoryId"
              label="Categoría *"
              required
              defaultValue={producto?.categoryId ?? ""}
              opciones={categorias.map((c) => ({ value: c.id, label: c.nombre }))}
              placeholder="Selecciona una categoría"
            />
          </Seccion>

          <Seccion titulo="Imagen">
            <Input
              name="imagenUrl"
              label="Ruta de imagen"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              hint="Ruta local en /public, p. ej. /productos/cuaderno.webp"
              placeholder="/productos/cuaderno.webp"
            />
            <div className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper-2">
              {previsualizable ? (
                <Image
                  src={imagenUrl}
                  alt="Previsualización de la imagen del producto"
                  fill
                  sizes="320px"
                  className="object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
                  <ImageOff aria-hidden="true" className="size-8" strokeWidth={1.5} />
                  <p className="text-step--1">Sin imagen</p>
                </div>
              )}
            </div>
          </Seccion>

          <Seccion titulo="Estado">
            <CampoCheckbox
              name="activo"
              label="Activo"
              descripcion="Visible en la tienda."
              defaultChecked={producto ? producto.activo : true}
            />
            <CampoCheckbox
              name="destacado"
              label="Destacado"
              descripcion="Aparece en secciones destacadas."
              defaultChecked={producto ? producto.destacado : false}
            />
          </Seccion>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <Button asChildLink href="/admin/productos" variant="ghost">
          <ArrowLeft aria-hidden="true" className="size-4.5" strokeWidth={2} />
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={enviando} disabled={enviando}>
          <Save aria-hidden="true" className="size-4.5" strokeWidth={2} />
          {esEdicion ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>

      <p className="text-step--1 text-ink-faint">
        Los campos marcados con <span className="text-rose">*</span> son
        obligatorios.
      </p>
    </form>
  );
}

/* ── Field blocks ─────────────────────────────────────────────────────────── */

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-line bg-paper p-5 shadow-card">
      <h2 className="font-display text-step-1 font-semibold text-ink">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

const claseControl = cn(
  "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 text-step-0 text-ink",
  "placeholder:text-ink-faint transition-[border-color,box-shadow] duration-200 ease-out",
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  "disabled:cursor-not-allowed disabled:opacity-55",
);

function CampoTextarea({
  name,
  label,
  hint,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.875rem] font-medium text-ink-soft">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        rows={4}
        aria-describedby={hint ? hintId : undefined}
        className={cn(claseControl, "h-auto min-h-28 py-2.5 leading-relaxed")}
      />
      {hint ? (
        <p id={hintId} className="text-[0.8rem] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function CampoPrecio({
  name,
  label,
  hint,
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const id = React.useId();
  const hintId = `${id}-hint`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.875rem] font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 font-medium text-ink-faint"
        >
          L
        </span>
        <input
          id={id}
          name={name}
          required={required}
          defaultValue={defaultValue}
          inputMode="decimal"
          placeholder="0.00"
          aria-describedby={hint ? hintId : undefined}
          className={cn(claseControl, "pl-7 tabular-nums")}
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-[0.8rem] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function CampoSelect({
  name,
  label,
  opciones,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  opciones: { value: string; label: string }[];
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[0.875rem] font-medium text-ink-soft">
        {label}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className={cn(
          claseControl,
          "pr-9 appearance-none bg-[length:1.1em] bg-[right_0.75rem_center] bg-no-repeat",
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234a463e%22 stroke-width=%222%22><path d=%22M6 9l6 6 6-6%22/></svg>')]",
        )}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoCheckbox({
  name,
  label,
  descripcion,
  defaultChecked,
}: {
  name: string;
  label: string;
  descripcion?: string;
  defaultChecked?: boolean;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-line bg-paper-2 px-3.5 py-3 transition-colors hover:bg-paper-3"
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value="1"
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4.5 shrink-0 cursor-pointer accent-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-step-0 font-medium text-ink">{label}</span>
        {descripcion ? (
          <span className="text-[0.8rem] text-ink-faint">{descripcion}</span>
        ) : null}
      </span>
    </label>
  );
}
