import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PasosCheckout — progress indicator of the Papelería Nova checkout.
 *
 * Server Component (no interactivity): it is rendered with the current step,
 * which the assembling page decides. Stationery aesthetic: the steps are joined
 * by a dashed "notebook line"; the active step is marked in indigo
 * (ink), the completed ones show a check on a mint stamp, and the
 * pending ones stay in a muted tone.
 *
 * Accessibility: <nav aria-label="Progreso de compra"> with an ordered list;
 * the active step carries aria-current="step" and the completed ones announce
 * "(completado)" to screen readers. The dashed line is decorative.
 *
 * Usage:
 *   <PasosCheckout pasoActual={2} />
 */
type NumeroPaso = 1 | 2 | 3;

const PASOS: { numero: NumeroPaso; etiqueta: string; descripcion: string }[] = [
  { numero: 1, etiqueta: "Carrito", descripcion: "Revisa tus útiles" },
  { numero: 2, etiqueta: "Pago y envío", descripcion: "Dirección y método" },
  { numero: 3, etiqueta: "Confirmación", descripcion: "¡Listo!" },
];

export function PasosCheckout({ pasoActual }: { pasoActual: NumeroPaso }) {
  return (
    <nav aria-label="Progreso de compra" className="w-full">
      <ol className="flex items-start justify-between gap-1 sm:gap-3">
        {PASOS.map((paso, indice) => {
          const completado = paso.numero < pasoActual;
          const activo = paso.numero === pasoActual;
          const esUltimo = indice === PASOS.length - 1;

          return (
            <li
              key={paso.numero}
              className="relative flex flex-1 flex-col items-center text-center"
            >
              {/* Dashed notebook line that connects to the next step.
                  Decorative; it starts to the right of the circle and spans the gap. */}
              {!esUltimo && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute left-1/2 top-5 -z-0 h-0.5 w-full",
                    "border-t-2 border-dashed",
                    completado ? "border-mint/60" : "border-line-strong",
                  )}
                />
              )}

              {/* Step marker */}
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border-2",
                  "font-display text-step-0 font-bold tabular-nums",
                  "transition-colors duration-200 ease-out",
                  completado &&
                    "border-mint bg-mint text-on-primary shadow-card",
                  activo &&
                    "border-primary bg-primary text-on-primary shadow-soft",
                  !completado &&
                    !activo &&
                    "border-line-strong bg-paper-2 text-ink-faint",
                )}
              >
                {completado ? (
                  <Check className="size-5" strokeWidth={3} />
                ) : (
                  paso.numero
                )}
              </span>

              {/* Label + description */}
              <span className="relative z-10 mt-2 flex flex-col gap-0.5 px-0.5">
                <span
                  aria-current={activo ? "step" : undefined}
                  className={cn(
                    "text-[0.78rem] font-semibold leading-tight sm:text-step-0",
                    activo && "text-primary",
                    completado && "text-ink",
                    !completado && !activo && "text-ink-faint",
                  )}
                >
                  {paso.etiqueta}
                  {completado && <span className="sr-only"> (completado)</span>}
                </span>
                {/* Description only visible on medium screens so as not to clutter
                    mobile; it adds context without noise. */}
                <span className="hidden text-[0.78rem] text-ink-faint sm:block">
                  {paso.descripcion}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
