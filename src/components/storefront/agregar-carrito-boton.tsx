"use client";

import * as React from "react";
import { ShoppingBag, Minus, Plus, Check } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCartStore } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * AgregarAlCarritoBoton — client island that adds a product to the cart.
 *
 * Two variants:
 * - "card": compact button (icon + "Agregar") for the catalog card.
 * - "ficha": accessible quantity selector (−/+ and a numeric input, clamp
 *   1..stock) + a large accent button, for the product page.
 *
 * Feedback on add: micro-bump + the text "Agregado" for ~1.5s with a polite
 * `aria-live`. Stock 0 ⇒ disabled with the text "Agotado". Respects
 * prefers-reduced-motion.
 *
 * Usage:
 *   <AgregarAlCarritoBoton producto={p} />                 // card
 *   <AgregarAlCarritoBoton producto={p} variante="ficha" />
 */
export interface ProductoCarrito {
  id: string;
  slug: string;
  nombre: string;
  precio: number;
  sku: string;
  stock: number;
  imagen?: { url: string; alt: string } | null;
}

export function AgregarAlCarritoBoton({
  producto,
  variante = "card",
  className,
}: {
  producto: ProductoCarrito;
  variante?: "card" | "ficha";
  className?: string;
}) {
  const reducir = useReducedMotion();
  const addItem = useCartStore((s) => s.addItem);
  const [cantidad, setCantidad] = React.useState(1);
  const [confirmado, setConfirmado] = React.useState(false);
  const temporizador = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const agotado = producto.stock <= 0;
  const topeAlcanzado = cantidad >= producto.stock;

  React.useEffect(() => {
    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    };
  }, []);

  const agregar = (n: number) => {
    if (agotado) return;
    addItem(
      {
        productId: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        sku: producto.sku,
        stock: producto.stock,
        imagen: producto.imagen?.url,
      },
      n,
    );
    setConfirmado(true);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setConfirmado(false), 1500);
  };

  // ── "card" variant: compact button ──────────────────────────────────────
  if (variante === "card") {
    return (
      <>
        <Button
          type="button"
          variant={confirmado ? "soft" : "accent"}
          size="sm"
          disabled={agotado}
          onClick={() => agregar(1)}
          aria-label={
            agotado
              ? `${producto.nombre}: agotado`
              : `Agregar ${producto.nombre} al carrito`
          }
          className={cn("w-full", className)}
        >
          <span className="relative inline-flex items-center gap-1.5">
            {confirmado ? (
              <Check aria-hidden="true" className="size-4" strokeWidth={2.5} />
            ) : (
              <ShoppingBag
                aria-hidden="true"
                className="size-4"
                strokeWidth={2}
              />
            )}
            {agotado ? "Agotado" : confirmado ? "Agregado" : "Agregar"}
          </span>
        </Button>
        <span aria-live="polite" className="sr-only">
          {confirmado ? `${producto.nombre} agregado al carrito` : ""}
        </span>
      </>
    );
  }

  // ── "ficha" variant: quantity selector + large CTA ──────────────────────
  const setCantidadSegura = (n: number) => {
    if (Number.isNaN(n)) return;
    setCantidad(Math.max(1, Math.min(Math.floor(n), Math.max(1, producto.stock))));
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center gap-4">
        <div
          role="group"
          aria-label="Cantidad"
          className={cn(
            "inline-flex h-13 items-center rounded-[var(--radius-md)] border border-line-strong bg-paper-2",
            agotado && "opacity-55",
          )}
        >
          <button
            type="button"
            onClick={() => setCantidadSegura(cantidad - 1)}
            disabled={agotado || cantidad <= 1}
            aria-label="Disminuir cantidad"
            className="inline-flex size-12 items-center justify-center rounded-l-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          </button>
          <label htmlFor={`cant-${producto.id}`} className="sr-only">
            Cantidad a agregar
          </label>
          <input
            id={`cant-${producto.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={Math.max(1, producto.stock)}
            value={cantidad}
            disabled={agotado}
            onChange={(e) => setCantidadSegura(Number(e.target.value))}
            className="h-full w-14 border-x border-line bg-transparent text-center text-step-0 font-semibold text-ink tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => setCantidadSegura(cantidad + 1)}
            disabled={agotado || topeAlcanzado}
            aria-label="Aumentar cantidad"
            className="inline-flex size-12 items-center justify-center rounded-r-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40"
          >
            <Plus aria-hidden="true" className="size-4" strokeWidth={2.5} />
          </button>
        </div>

        <motion.div
          whileTap={reducir || agotado ? undefined : { scale: 0.97 }}
          className="flex-1 min-w-[12rem]"
        >
          <Button
            type="button"
            variant="accent"
            size="lg"
            disabled={agotado}
            onClick={() => agregar(cantidad)}
            className="w-full"
            aria-label={
              agotado
                ? `${producto.nombre}: agotado`
                : `Agregar ${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} de ${producto.nombre} al carrito`
            }
          >
            <AnimatePresence mode="wait" initial={false}>
              {confirmado ? (
                <motion.span
                  key="ok"
                  initial={reducir ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducir ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2"
                >
                  <Check aria-hidden="true" className="size-5" strokeWidth={2.5} />
                  Agregado
                </motion.span>
              ) : (
                <motion.span
                  key="add"
                  initial={reducir ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reducir ? undefined : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="inline-flex items-center gap-2"
                >
                  <ShoppingBag
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2}
                  />
                  {agotado ? "Agotado" : "Agregar al carrito"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>
      </div>

      {!agotado && producto.stock <= 5 && (
        <p className="text-[0.85rem] font-medium text-amber">
          Quedan solo {producto.stock}{" "}
          {producto.stock === 1 ? "unidad" : "unidades"} en existencia.
        </p>
      )}

      <span aria-live="polite" className="sr-only">
        {confirmado
          ? `${cantidad} ${cantidad === 1 ? "unidad" : "unidades"} de ${producto.nombre} agregadas al carrito`
          : ""}
      </span>
    </div>
  );
}
