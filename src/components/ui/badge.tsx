import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — Papelería Nova's paper tag.
 *
 * Tag shape with the top-left corner clipped (clip-path), evoking a
 * sticker/inventory card. Semantic variants for product states.
 *
 * Usage:
 *   <Badge variant="nuevo">Nuevo</Badge>
 *   <Badge variant="stock-bajo">Pocas unidades</Badge>
 */
type BadgeVariant =
  | "nuevo"
  | "oferta"
  | "stock-bajo"
  | "agotado"
  | "neutral";

const variantes: Record<BadgeVariant, string> = {
  nuevo: "bg-mint-50 text-mint border-mint/30",
  oferta: "bg-accent-50 text-accent-600 border-accent/30",
  "stock-bajo": "bg-amber-50 text-amber border-amber/40",
  agotado: "bg-rose-50 text-rose border-rose/30",
  neutral: "bg-paper-3 text-ink-soft border-line",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/**
 * Subtle clipped corner that gives the "paper tag" feel.
 * Defined as a style with a CSS variable to avoid loose magic values.
 */
const recorteEtiqueta: React.CSSProperties = {
  clipPath:
    "polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)",
};

export function Badge({
  className,
  variant = "neutral",
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      style={{ ...recorteEtiqueta, ...style }}
      className={cn(
        "inline-flex items-center gap-1 border px-2.5 py-0.5",
        "text-[0.72rem] font-semibold uppercase tracking-wide",
        "rounded-r-[var(--radius-sm)] rounded-bl-[var(--radius-sm)]",
        variantes[variant],
        className,
      )}
      {...props}
    />
  );
}
