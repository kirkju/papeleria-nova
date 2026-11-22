import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, formatearLempiras } from "@/lib/utils";

/**
 * StatCard — metric (KPI) card of the dashboard.
 *
 * Server-friendly. It shows a label, a large value (display, tabular-nums)
 * and an optional trend vs the previous period. The trend is conveyed with an
 * arrow + semantic color AND ALWAYS with text (percentage + label), never by
 * color alone (accessibility: the numeric value and the label carry the
 * message even if the color is not perceived).
 *
 * `formato`:
 *  - "moneda": the numeric `valor` is formatted with formatearLempiras ("L 1,250.00").
 *  - "numero": it is formatted with the es-HN thousands separator.
 *  - If `valor` is a string, it is printed as is (use it for texts such as "—").
 *
 * `tendencia.valor` is the percentage change (e.g. 12.5 = +12.5%, -8 = -8%).
 * The sign determines the color/arrow; 0 is shown as neutral ("Sin cambios").
 *
 * Usage:
 *   <StatCard
 *     etiqueta="Ventas del mes"
 *     valor={48250}
 *     formato="moneda"
 *     icono={<TrendingUp className="size-5" />}
 *     tendencia={{ valor: 12.5, etiqueta: "vs. mes anterior" }}
 *   />
 */
const formateadorNumero = new Intl.NumberFormat("es-HN");

function formatearValor(
  valor: number | string,
  formato: "moneda" | "numero",
): string {
  if (typeof valor === "string") return valor;
  if (formato === "moneda") return formatearLempiras(valor);
  return formateadorNumero.format(valor);
}

export function StatCard({
  etiqueta,
  valor,
  tendencia,
  icono,
  formato = "numero",
  className,
}: {
  etiqueta: string;
  valor: number | string;
  tendencia?: { valor: number; etiqueta: string };
  icono?: React.ReactNode;
  formato?: "moneda" | "numero";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-[var(--radius-lg)] border border-line bg-paper p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-step--1 font-medium text-ink-soft">
          {etiqueta}
        </span>
        {icono ? (
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary-50 text-primary-600"
          >
            {icono}
          </span>
        ) : null}
      </div>

      <p className="font-display text-step-2 font-bold leading-none tracking-tight text-ink tabular-nums">
        {formatearValor(valor, formato)}
      </p>

      {tendencia ? <Tendencia {...tendencia} /> : null}
    </div>
  );
}

function Tendencia({ valor, etiqueta }: { valor: number; etiqueta: string }) {
  const sube = valor > 0;
  const baja = valor < 0;
  const neutro = valor === 0;

  const Icono = neutro ? Minus : sube ? ArrowUpRight : ArrowDownRight;
  const color = neutro
    ? "text-ink-faint"
    : sube
      ? "text-mint"
      : "text-rose";

  // Explicit text: sign + absolute value. For screen readers and color-blind users
  // the figure travels in the text ("+12.5%"), not just in the color/arrow.
  const signo = sube ? "+" : baja ? "−" : "";
  const porcentaje = `${signo}${Math.abs(valor).toLocaleString("es-HN", {
    maximumFractionDigits: 1,
  })}%`;
  const descripcionAccesible = neutro
    ? "Sin cambios"
    : sube
      ? "Aumento"
      : "Disminución";

  return (
    <p className="flex items-center gap-1.5 text-step--1">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 font-semibold tabular-nums",
          color,
        )}
      >
        <Icono aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
        <span className="sr-only">{descripcionAccesible} de </span>
        {neutro ? "Sin cambios" : porcentaje}
      </span>
      <span className="text-ink-faint">{etiqueta}</span>
    </p>
  );
}
