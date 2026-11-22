"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * GaleriaProducto — gallery of the product page (client island).
 *
 * Large main image with the category tint as its background (radius xl) and a
 * strip of selectable thumbnails (only if there is more than one image). The
 * thumbnails are accessible buttons: keyboard-navigable, with
 * `aria-current` on the active one and visible focus. Respects next/image (sizes/alt).
 *
 * It receives the images already serialized from the server (url + alt) and the
 * category's background class (computed on the server so as to use literal
 * classes that Tailwind can detect).
 *
 * Usage:
 *   <GaleriaProducto imagenes={p.imagenes} nombre={p.nombre} fondo="bg-cat-arte" />
 */
export interface ImagenGaleria {
  url: string;
  alt: string;
}

export function GaleriaProducto({
  imagenes,
  nombre,
  fondo,
}: {
  imagenes: ImagenGaleria[];
  nombre: string;
  fondo: string;
}) {
  const [activa, setActiva] = React.useState(0);

  // Fallback: if there are no images, we use the placeholder.
  const lista: ImagenGaleria[] =
    imagenes.length > 0
      ? imagenes
      : [{ url: "/productos/placeholder.svg", alt: nombre }];

  const indice = Math.min(activa, lista.length - 1);
  const principal = lista[indice];

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div
        className={cn(
          "relative aspect-square w-full overflow-hidden rounded-[var(--radius-xl)] border border-line",
          fondo,
        )}
      >
        <Image
          src={principal.url}
          alt={principal.alt || nombre}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 560px"
          className="object-cover"
        />
      </div>

      {/* Thumbnails (only if there is more than one) */}
      {lista.length > 1 && (
        <ul
          role="list"
          aria-label="Miniaturas del producto"
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {lista.map((img, i) => (
            <li key={`${img.url}-${i}`}>
              <button
                type="button"
                onClick={() => setActiva(i)}
                aria-current={i === indice ? "true" : undefined}
                aria-label={`Ver imagen ${i + 1} de ${lista.length}`}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-[var(--radius-md)] border-2",
                  fondo,
                  "transition-[border-color,transform] duration-200 ease-out",
                  "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper motion-reduce:transform-none",
                  i === indice
                    ? "border-primary"
                    : "border-transparent hover:border-line-strong",
                )}
              >
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="120px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
