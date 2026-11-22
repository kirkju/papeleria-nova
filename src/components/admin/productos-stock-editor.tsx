"use client";

import * as React from "react";
import { Check, Pencil, X } from "lucide-react";
import { ajustarStock } from "@/server/admin/productos";
import { UMBRAL_STOCK_BAJO } from "@/lib/validators/admin";
import { cn } from "@/lib/utils";

/**
 * ProductosStockEditor — inline editing of a product's stock (client island).
 *
 * It appears as a pill with the current stock value and a pencil button that
 * opens a numeric input + save/cancel. On save it calls the `ajustarStock` server
 * action ("inventario:ajustarStock"); the hard barrier lives on the server.
 * The result is announced with `aria-live="polite"` for screen readers.
 *
 * It is only mounted when the user can adjust stock (the PAGE decides with
 * `can("inventario:ajustarStock")`): otherwise the plain value is rendered, with no editor.
 *
 * The stock is colored (amber if <= threshold, rose if 0) BUT it always carries
 * text and the numeric figure; it is never conveyed by color alone.
 */
export function ProductosStockEditor({
  id,
  nombre,
  stockInicial,
}: {
  id: string;
  nombre: string;
  stockInicial: number;
}) {
  const [editando, setEditando] = React.useState(false);
  const [stock, setStock] = React.useState(stockInicial);
  const [valor, setValor] = React.useState(String(stockInicial));
  const [pendiente, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [mensaje, setMensaje] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // If the stock changes from the server (revalidation), we re-sync the displayed
  // value as long as it is not being edited ("adjusting while rendering" pattern).
  const [stockPrevio, setStockPrevio] = React.useState(stockInicial);
  if (stockInicial !== stockPrevio && !editando) {
    setStockPrevio(stockInicial);
    setStock(stockInicial);
    setValor(String(stockInicial));
  }

  React.useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  function abrir() {
    setValor(String(stock));
    setError(null);
    setMensaje(null);
    setEditando(true);
  }

  function cancelar() {
    setValor(String(stock));
    setError(null);
    setEditando(false);
  }

  function guardar() {
    const limpio = valor.trim();
    const numero = Number(limpio);
    if (limpio === "" || !Number.isInteger(numero) || numero < 0) {
      setError("Ingresa un número entero mayor o igual a 0.");
      return;
    }
    if (numero === stock) {
      setEditando(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const resultado = await ajustarStock(id, numero);
      if (resultado.ok) {
        setStock(numero);
        setStockPrevio(numero);
        setEditando(false);
        setMensaje(`Stock de ${nombre} actualizado a ${numero}.`);
      } else {
        setError(resultado.error);
      }
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      guardar();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelar();
    }
  }

  const colorStock =
    stock === 0 ? "text-rose" : stock <= UMBRAL_STOCK_BAJO ? "text-amber" : "text-ink";

  if (!editando) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className={cn("tabular-nums font-semibold", colorStock)}>
          {stock}
        </span>
        <button
          type="button"
          onClick={abrir}
          aria-label={`Editar stock de ${nombre} (actual: ${stock})`}
          className="grid size-7 place-items-center rounded-[var(--radius-sm)] text-ink-faint transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Pencil aria-hidden="true" className="size-3.5" strokeWidth={2} />
        </button>
        <span aria-live="polite" className="sr-only">
          {mensaje ?? ""}
        </span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <div className="inline-flex items-center gap-1.5">
        <label htmlFor={`stock-${id}`} className="sr-only">
          Nuevo stock de {nombre}
        </label>
        <input
          ref={inputRef}
          id={`stock-${id}`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={valor}
          disabled={pendiente}
          onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ""))}
          onKeyDown={onKeyDown}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `stock-${id}-error` : undefined}
          className="h-8 w-16 rounded-[var(--radius-sm)] border border-line bg-paper px-2 text-step--1 text-ink tabular-nums focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-55 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={guardar}
          disabled={pendiente}
          aria-label="Guardar stock"
          className="grid size-7 place-items-center rounded-[var(--radius-sm)] bg-primary text-on-primary transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
        >
          <Check aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          onClick={cancelar}
          disabled={pendiente}
          aria-label="Cancelar"
          className="grid size-7 place-items-center rounded-[var(--radius-sm)] border border-line text-ink-soft transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55"
        >
          <X aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
        </button>
      </div>
      {error ? (
        <p
          id={`stock-${id}-error`}
          role="alert"
          className="text-[0.72rem] font-medium text-rose"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
