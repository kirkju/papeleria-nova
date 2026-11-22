"use client";

import * as React from "react";
import { Loader2, Star } from "lucide-react";
import { alternarDestacado } from "@/server/admin/productos";
import { cn } from "@/lib/utils";

/**
 * ProductosDestacadoToggle — a product's "destacado" (featured) switch (island).
 *
 * Button with `aria-pressed` state that calls `alternarDestacado`
 * ("producto:editar", ADMIN ONLY; the hard barrier lives on the server). The state
 * is updated optimistically and reverted if the server action fails.
 *
 * It is only mounted when the user can edit (the PAGE decides with
 * `can("producto:editar")`): otherwise a static, read-only star is shown.
 * The state is conveyed with accessible text in addition to color/fill.
 */
export function ProductosDestacadoToggle({
  id,
  nombre,
  destacadoInicial,
}: {
  id: string;
  nombre: string;
  destacadoInicial: boolean;
}) {
  const [destacado, setDestacado] = React.useState(destacadoInicial);
  const [pendiente, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);

  // Re-syncs after the server revalidation if there is no mutation in flight.
  const [previo, setPrevio] = React.useState(destacadoInicial);
  if (destacadoInicial !== previo && !pendiente) {
    setPrevio(destacadoInicial);
    setDestacado(destacadoInicial);
  }

  function alternar() {
    const objetivo = !destacado;
    setDestacado(objetivo); // optimistic
    setError(null);
    startTransition(async () => {
      const resultado = await alternarDestacado(id);
      if (!resultado.ok) {
        setDestacado(!objetivo); // revert
        setError(resultado.error);
      }
    });
  }

  return (
    <div className="inline-flex flex-col items-center gap-0.5">
      <button
        type="button"
        onClick={alternar}
        disabled={pendiente}
        aria-pressed={destacado}
        aria-label={
          destacado
            ? `Quitar ${nombre} de destacados`
            : `Marcar ${nombre} como destacado`
        }
        className={cn(
          "grid size-8 place-items-center rounded-[var(--radius-md)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-55",
          destacado
            ? "bg-amber-50 text-amber"
            : "text-ink-faint hover:bg-paper-3 hover:text-ink-soft",
        )}
      >
        {pendiente ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" strokeWidth={2.5} />
        ) : (
          <Star
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
            fill={destacado ? "currentColor" : "none"}
          />
        )}
      </button>
      <span className="sr-only" aria-live="polite">
        {error
          ? error
          : destacado
            ? `${nombre} está destacado`
            : `${nombre} no está destacado`}
      </span>
    </div>
  );
}
