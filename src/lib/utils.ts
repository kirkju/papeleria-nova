import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Joins conditional classes (clsx) and resolves Tailwind conflicts (twMerge).
 * Usage: cn("p-2", isActive && "bg-primary", className)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const formateadorLempiras = new Intl.NumberFormat("es-HN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an amount as Honduran Lempiras in the "L 1,250.00" format.
 * Accepts a number or a numeric string. Invalid values return "L 0.00".
 * Usage: formatearLempiras(1250) -> "L 1,250.00"
 */
export function formatearLempiras(valor: number | string): string {
  const numero = typeof valor === "string" ? Number(valor) : valor;
  const seguro = Number.isFinite(numero) ? numero : 0;
  return `L ${formateadorLempiras.format(seguro)}`;
}
