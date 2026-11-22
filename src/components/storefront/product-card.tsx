import Image from "next/image";
import Link from "next/link";
import type { ProductoCard } from "@/server/catalogo";
import { Badge } from "@/components/ui/badge";
import { formatearLempiras, cn } from "@/lib/utils";
import { AgregarAlCarritoBoton } from "./agregar-carrito-boton";

/**
 * ProductCard — Papelería Nova's product card.
 *
 * Server-friendly: it does NOT use "use client". The only interactive piece (add
 * to cart) is isolated in `AgregarAlCarritoBoton`. The whole card is a
 * link to /producto/<slug> with visible focus; the add button is layered on top
 * with z-index so that it does not trigger the navigation.
 *
 * Identity: surface with its category tint, the placeholder image, name in
 * the display font, prominent price with comparePrice struck through,
 * paper badges (Nuevo / Oferta / Pocas unidades / Agotado). Hover: elevation
 * + subtle tilt ≤3° via CSS, disabled with prefers-reduced-motion. The
 * "Agregar" button appears on hover/focus-within and ALWAYS on touch (no hover).
 *
 * Usage:
 *   <ProductCard producto={p} />   // p: ProductoCard from @/server/catalogo
 */

/** Category slugs with their own tint token (bg-cat-*). */
const SLUGS_CON_TINTE = new Set([
  "escritura",
  "cuadernos",
  "arte",
  "oficina",
  "mochilas",
  "manualidades",
  "tecnologia",
  "geometria",
]);

/** Explicit slug → background class map (Tailwind needs literal classes). */
const FONDO_CAT: Record<string, string> = {
  escritura: "bg-cat-escritura",
  cuadernos: "bg-cat-cuadernos",
  arte: "bg-cat-arte",
  oficina: "bg-cat-oficina",
  mochilas: "bg-cat-mochilas",
  manualidades: "bg-cat-manualidades",
  tecnologia: "bg-cat-tecnologia",
  geometria: "bg-cat-geometria",
};

const DIAS_NUEVO = 30;

function esNuevo(creadoEnISO: string): boolean {
  const creado = new Date(creadoEnISO).getTime();
  if (Number.isNaN(creado)) return false;
  const treintaDias = DIAS_NUEVO * 24 * 60 * 60 * 1000;
  return Date.now() - creado < treintaDias;
}

export function ProductCard({ producto }: { producto: ProductoCard }) {
  const enOferta =
    producto.comparePrice !== null && producto.comparePrice > producto.precio;
  const agotado = producto.stock <= 0;
  const pocas = producto.stock > 0 && producto.stock <= 5;
  const nuevo = esNuevo(producto.creadoEn);

  const fondo = SLUGS_CON_TINTE.has(producto.categoria.slug)
    ? FONDO_CAT[producto.categoria.slug]
    : "bg-paper-3";

  return (
    <article
      className={cn(
        // `pn-card`: group that coordinates hover/tilt via CSS (see globals.css).
        "pn-card group/card relative flex h-full flex-col overflow-hidden",
        "rounded-[var(--radius-lg)] border border-line bg-paper-2 shadow-card",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:-translate-y-1 hover:border-line-strong hover:shadow-lift",
        "focus-within:-translate-y-1 focus-within:border-line-strong focus-within:shadow-lift",
      )}
    >
      {/* Image area with the category tint */}
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden",
          fondo,
        )}
      >
        <Image
          src={producto.imagen?.url ?? "/productos/placeholder.svg"}
          alt={producto.imagen?.alt || producto.nombre}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            "group-hover/card:scale-[1.04] motion-reduce:transform-none",
            agotado && "opacity-60 saturate-50",
          )}
        />

        {/* Paper badges, top-left corner */}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {agotado ? (
            <Badge variant="agotado">Agotado</Badge>
          ) : (
            <>
              {nuevo && <Badge variant="nuevo">Nuevo</Badge>}
              {enOferta && <Badge variant="oferta">Oferta</Badge>}
              {pocas && <Badge variant="stock-bajo">Pocas unidades</Badge>}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        {producto.marca && (
          <span className="text-[0.72rem] font-semibold uppercase tracking-wide text-ink-faint">
            {producto.marca}
          </span>
        )}

        <h3 className="font-display text-step-0 font-semibold leading-snug text-ink">
          {/* Link that covers the whole card (stretched link) */}
          <Link
            href={`/producto/${producto.slug}`}
            className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none"
          >
            <span className="line-clamp-2">{producto.nombre}</span>
          </Link>
        </h3>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="font-display text-step-1 font-bold text-ink">
            {formatearLempiras(producto.precio)}
          </span>
          {enOferta && producto.comparePrice !== null && (
            <span className="text-[0.85rem] text-ink-faint line-through">
              <span className="sr-only">antes </span>
              {formatearLempiras(producto.comparePrice)}
            </span>
          )}
        </div>

        {/* Action: appears on hover/focus-within; always visible on touch.
            z-10 + relative position to stay above the stretched link. */}
        <div
          className={cn(
            "relative z-10 pt-3",
            // On devices without hover (touch) always visible:
            "[@media(hover:hover)]:pointer-events-none [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0",
            "[@media(hover:hover)]:transition-[opacity,transform] [@media(hover:hover)]:duration-200",
            "[@media(hover:hover)]:group-hover/card:pointer-events-auto [@media(hover:hover)]:group-hover/card:translate-y-0 [@media(hover:hover)]:group-hover/card:opacity-100",
            "[@media(hover:hover)]:group-focus-within/card:pointer-events-auto [@media(hover:hover)]:group-focus-within/card:translate-y-0 [@media(hover:hover)]:group-focus-within/card:opacity-100",
            "motion-reduce:transition-none",
          )}
        >
          <AgregarAlCarritoBoton
            producto={{
              id: producto.id,
              slug: producto.slug,
              nombre: producto.nombre,
              precio: producto.precio,
              sku: producto.sku,
              stock: producto.stock,
              imagen: producto.imagen,
            }}
            variante="card"
          />
        </div>
      </div>
    </article>
  );
}
