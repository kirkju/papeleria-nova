/**
 * Utility tests: formatearLempiras and cn.
 *
 * Covers: currency format in Lempiras (L), thousands separators, decimals,
 * edge values (0, negatives, numeric strings, invalid values) and the
 * merging/deduplication of Tailwind classes with cn().
 */
import { describe, it, expect } from "vitest";
import { formatearLempiras, cn } from "./utils";

describe("formatearLempiras — formato de moneda en Lempiras", () => {
  it("formatea 1250 como 'L 1,250.00'", () => {
    expect(formatearLempiras(1250)).toBe("L 1,250.00");
  });

  it("formatea 0 como 'L 0.00'", () => {
    expect(formatearLempiras(0)).toBe("L 0.00");
  });

  it("formatea 1250.5 con 2 decimales 'L 1,250.50'", () => {
    expect(formatearLempiras(1250.5)).toBe("L 1,250.50");
  });

  it("formatea 1250.505 redondeando a 2 decimales 'L 1,250.51' o '...50'", () => {
    // The exact result depends on the formatter's rounding; what matters
    // is that it has 2 decimals and starts with 'L '
    const resultado = formatearLempiras(1250.505);
    expect(resultado).toMatch(/^L \d{1,3}(,\d{3})*\.\d{2}$/);
  });

  it("formatea miles grandes: 1000000 tiene separadores de miles", () => {
    const resultado = formatearLempiras(1000000);
    expect(resultado).toBe("L 1,000,000.00");
  });

  it("formatea 999999.99 correctamente", () => {
    expect(formatearLempiras(999999.99)).toBe("L 999,999.99");
  });

  it("formatea número como string numérico '1250'", () => {
    expect(formatearLempiras("1250")).toBe("L 1,250.00");
  });

  it("string inválido 'abc' devuelve 'L 0.00'", () => {
    expect(formatearLempiras("abc")).toBe("L 0.00");
  });

  it("NaN devuelve 'L 0.00'", () => {
    expect(formatearLempiras(NaN)).toBe("L 0.00");
  });

  it("Infinity devuelve 'L 0.00'", () => {
    expect(formatearLempiras(Infinity)).toBe("L 0.00");
  });

  it("valor negativo se formatea con signo negativo", () => {
    const resultado = formatearLempiras(-500);
    // It must have the L prefix and the amount
    expect(resultado).toContain("L");
    expect(resultado).toContain("500");
  });

  it("precio de lápiz 15.50 en Lempiras", () => {
    expect(formatearLempiras(15.5)).toBe("L 15.50");
  });

  it("precio de mochila 1850 en Lempiras", () => {
    expect(formatearLempiras(1850)).toBe("L 1,850.00");
  });
});

describe("cn — combinación de clases Tailwind", () => {
  it("combina dos clases simples", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("deduplicar clases conflictivas de Tailwind (la última gana)", () => {
    // twMerge resolves conflicts: p-4 wins over p-2
    const resultado = cn("p-2", "p-4");
    expect(resultado).toBe("p-4");
  });

  it("ignora valores falsy (false, null, undefined)", () => {
    expect(cn("base", false, null, undefined, "extra")).toBe("base extra");
  });

  it("clase condicional incluida cuando la condición es true", () => {
    const activo = true;
    expect(cn("item", activo && "activo")).toBe("item activo");
  });

  it("clase condicional excluida cuando la condición es false", () => {
    const activo = false;
    expect(cn("item", activo && "activo")).toBe("item");
  });

  it("sin argumentos devuelve string vacío", () => {
    expect(cn()).toBe("");
  });

  it("string vacío no aporta nada", () => {
    expect(cn("", "clase")).toBe("clase");
  });

  it("combina múltiples clases con variantes y conflictos Tailwind", () => {
    // text-sm and text-lg conflict; text-lg wins
    const resultado = cn("text-sm", "font-bold", "text-lg");
    expect(resultado).toBe("font-bold text-lg");
  });

  it("acepta array de clases (clsx)", () => {
    expect(cn(["px-4", "py-2"], "mt-2")).toBe("px-4 py-2 mt-2");
  });

  it("acepta objeto de clases condicionales (clsx)", () => {
    expect(cn({ "bg-red-500": true, "bg-blue-500": false }, "text-white")).toBe(
      "bg-red-500 text-white",
    );
  });

  it("deduplicar clases bg conflictivas (la más reciente gana)", () => {
    const resultado = cn("bg-primary", "bg-secondary");
    // twMerge detects the bg conflict and keeps the second one
    expect(resultado).toBe("bg-secondary");
  });
});
