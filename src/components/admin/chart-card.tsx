import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * ChartCard — consistent wrapper for an admin chart (or any
 * panel): header with a title + optional description, an actions slot on
 * the right (range filters, period selector) and the body.
 *
 * Server-friendly: composition only, no state. The chart that goes inside
 * (from graficos.tsx) is a client component, but ChartCard can render on the server.
 *
 * Usage:
 *   <ChartCard titulo="Ventas por día" descripcion="Últimos 30 días">
 *     <GraficoVentasDia data={serie} />
 *   </ChartCard>
 */
export function ChartCard({
  titulo,
  descripcion,
  children,
  accionesDerecha,
  className,
}: {
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
  accionesDerecha?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-[var(--radius-lg)] border border-line bg-paper shadow-card",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-step-1 font-semibold leading-tight text-ink">
            {titulo}
          </h2>
          {descripcion ? (
            <p className="text-step--1 text-ink-soft">{descripcion}</p>
          ) : null}
        </div>
        {accionesDerecha ? (
          <div className="flex shrink-0 items-center gap-2">
            {accionesDerecha}
          </div>
        ) : null}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
