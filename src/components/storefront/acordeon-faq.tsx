"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AcordeonFaq — list of frequently asked questions with an accessible disclosure pattern.
 *
 * DESIGN DECISION (documented): "exclusive" mode — only ONE answer open at a
 * time. For an FAQ that is the right call: it reduces visual noise, spares the
 * user from hunting for the answer among many open ones and keeps the page
 * compact on mobile. The FIRST question starts open to invite reading.
 * (If several open at once should be allowed in the future, the state changes
 * to a Set<number>; the ARIA structure already supports it.)
 *
 * Accessibility:
 *  - Each header is a <button> with aria-expanded and aria-controls.
 *  - Each answer is a panel with role="region" aria-labelledby (it points to the button).
 *  - The closed panel uses the `hidden` attribute (not just CSS) -> it is neither
 *    focusable nor read by screen readers.
 *  - Keyboard: besides the button's native Enter/Space, it supports Arrow up/down
 *    (move focus between headers), Home/End (first/last). APG Accordion pattern.
 *  - The "+" icon rotates into an "x" on open; with prefers-reduced-motion it does
 *    not animate (the global CSS already neutralizes the transitions).
 *
 * Visual:
 *  - Notebook-style borders: dashed separator between items; no hard box.
 *  - Question in the display font; answer with comfortable line spacing.
 *
 * Usage:
 *   <AcordeonFaq
 *     items={[
 *       { pregunta: "¿Hacen envíos a todo el país?", respuesta: "Sí, a todo Honduras…" },
 *       { pregunta: "¿Qué métodos de pago aceptan?", respuesta: "Tarjeta y transferencia…" },
 *     ]}
 *   />
 */
export interface ItemFaq {
  pregunta: string;
  respuesta: string;
}

export interface AcordeonFaqProps {
  items: ItemFaq[];
  className?: string;
}

export function AcordeonFaq({ items, className }: AcordeonFaqProps) {
  const baseId = React.useId();
  // null = none open; 0 = first one open by default (if there are items).
  const [abierta, setAbierta] = React.useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  // Refs to each header button to manage focus with the keyboard.
  const botonesRef = React.useRef<(HTMLButtonElement | null)[]>([]);

  function alternar(indice: number) {
    setAbierta((actual) => (actual === indice ? null : indice));
  }

  function enfocar(indice: number) {
    botonesRef.current[indice]?.focus();
  }

  function manejarTeclado(
    evento: React.KeyboardEvent<HTMLButtonElement>,
    indice: number,
  ) {
    const ultimo = items.length - 1;
    switch (evento.key) {
      case "ArrowDown":
        evento.preventDefault();
        enfocar(indice === ultimo ? 0 : indice + 1);
        break;
      case "ArrowUp":
        evento.preventDefault();
        enfocar(indice === 0 ? ultimo : indice - 1);
        break;
      case "Home":
        evento.preventDefault();
        enfocar(0);
        break;
      case "End":
        evento.preventDefault();
        enfocar(ultimo);
        break;
      default:
        break;
    }
  }

  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        // Notebook lines: dashed separator between items, top and bottom border.
        "divide-y divide-dashed divide-line-strong border-y border-dashed border-line-strong",
        className,
      )}
    >
      {items.map((item, indice) => {
        const expandida = abierta === indice;
        const botonId = `${baseId}-boton-${indice}`;
        const panelId = `${baseId}-panel-${indice}`;

        return (
          <div key={item.pregunta}>
            <h3 className="m-0">
              <button
                type="button"
                id={botonId}
                ref={(el) => {
                  botonesRef.current[indice] = el;
                }}
                aria-expanded={expandida}
                aria-controls={panelId}
                onClick={() => alternar(indice)}
                onKeyDown={(e) => manejarTeclado(e, indice)}
                className={cn(
                  "group flex w-full items-center gap-4 py-5 text-left",
                  "font-display text-step-1 font-semibold leading-snug text-ink",
                  "transition-colors duration-200 hover:text-primary-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:rounded-[var(--radius-sm)]",
                )}
              >
                <span className="flex-1">{item.pregunta}</span>
                {/* "+" indicator that rotates into an "x" on open. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] border border-line bg-paper-2 text-ink-soft",
                    "transition-[transform,background-color,color] duration-200 ease-out",
                    "group-hover:border-primary/40 group-hover:bg-primary-50 group-hover:text-primary-600",
                    expandida && "rotate-45 bg-accent-50 text-accent-600",
                  )}
                >
                  <Plus className="size-5" strokeWidth={2.5} />
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={botonId}
              hidden={!expandida}
              className="pb-6 pr-12"
            >
              <p className="max-w-[60ch] text-step-0 leading-[1.7] text-ink-soft">
                {item.respuesta}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
