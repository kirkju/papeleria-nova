/**
 * Tests for the PURE functions of the checkout calculation:
 *   calcularEnvio, redondear2, generarNumeroPedido
 *   and the constants ENVIO_GRATIS_DESDE / COSTO_ENVIO.
 *
 * None of the imported functions does IO, uses Prisma or depends on Next:
 * they are deterministic (except for the randomness of the order number, which
 * is tested statistically).
 */
import { describe, it, expect } from "vitest";
import {
  calcularEnvio,
  redondear2,
  generarNumeroPedido,
  ENVIO_GRATIS_DESDE,
  COSTO_ENVIO,
} from "./calculos";

// ──────────────────────────────────────────────────────────────────────────────
// Exported constants
// ──────────────────────────────────────────────────────────────────────────────

describe("constantes exportadas de calculos.ts", () => {
  it("ENVIO_GRATIS_DESDE es 1500", () => {
    expect(ENVIO_GRATIS_DESDE).toBe(1500);
  });

  it("COSTO_ENVIO es 80", () => {
    expect(COSTO_ENVIO).toBe(80);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// calcularEnvio — rule: subtotal STRICTLY greater than 1500 => free
// ──────────────────────────────────────────────────────────────────────────────

describe("calcularEnvio — costo de envío según subtotal", () => {
  it("subtotal 0 paga envío (L 80)", () => {
    expect(calcularEnvio(0)).toBe(COSTO_ENVIO);
  });

  it("subtotal pequeño (L 50) paga envío (L 80)", () => {
    expect(calcularEnvio(50)).toBe(COSTO_ENVIO);
  });

  it("subtotal 749.99 paga envío (L 80)", () => {
    expect(calcularEnvio(749.99)).toBe(COSTO_ENVIO);
  });

  it("subtotal exactamente 1500.00 TODAVÍA PAGA envío — la regla es estrictamente mayor", () => {
    expect(calcularEnvio(1500)).toBe(COSTO_ENVIO);
  });

  it("subtotal 1500.01 ya es gratis (primer centavo sobre el umbral)", () => {
    expect(calcularEnvio(1500.01)).toBe(0);
  });

  it("subtotal grande (L 5000) es gratis", () => {
    expect(calcularEnvio(5000)).toBe(0);
  });

  it("subtotal igual a ENVIO_GRATIS_DESDE paga envío (comparación con la constante)", () => {
    expect(calcularEnvio(ENVIO_GRATIS_DESDE)).toBe(COSTO_ENVIO);
  });

  it("subtotal ENVIO_GRATIS_DESDE + 0.01 es gratis (comparación con la constante)", () => {
    expect(calcularEnvio(ENVIO_GRATIS_DESDE + 0.01)).toBe(0);
  });

  it("devuelve exactamente 0 cuando es gratis (no undefined ni null)", () => {
    const resultado = calcularEnvio(2000);
    expect(resultado).toBe(0);
  });

  it("devuelve exactamente COSTO_ENVIO (80) cuando no es gratis (no otro número)", () => {
    const resultado = calcularEnvio(100);
    expect(resultado).toBe(80);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// redondear2 — rounding to 2 decimals avoiding floating-point errors
// ──────────────────────────────────────────────────────────────────────────────

describe("redondear2 — redondeo a 2 decimales", () => {
  it("0.1 + 0.2 redondeado da 0.30 exacto", () => {
    expect(redondear2(0.1 + 0.2)).toBe(0.3);
  });

  it("valor exacto (10.50) no cambia", () => {
    expect(redondear2(10.5)).toBe(10.5);
  });

  it("10.555 se redondea a 10.56", () => {
    expect(redondear2(10.555)).toBe(10.56);
  });

  it("valor entero (1500) sale con dos decimales implícitos (sigue siendo 1500)", () => {
    expect(redondear2(1500)).toBe(1500);
  });

  it("0 queda como 0", () => {
    expect(redondear2(0)).toBe(0);
  });

  it("precio de lápiz 15.50 no cambia", () => {
    expect(redondear2(15.5)).toBe(15.5);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// generarNumeroPedido — format and properties of the generated number
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Actual alphabet of the suffix: digits 2-9 + letters A-H, J-N, P-Z
 * (no 0, 1, I, O to avoid visual ambiguity).
 * Equivalent regex character class: [2-9A-HJ-NP-Z]
 */
const REGEX_NUMERO_PEDIDO = /^PN-\d{4}-[2-9A-HJ-NP-Z]{6}$/;

describe("generarNumeroPedido — formato del número", () => {
  it("cumple el formato PN-YYYY-XXXXXX con regex estricto", () => {
    const numero = generarNumeroPedido();
    expect(numero).toMatch(REGEX_NUMERO_PEDIDO);
  });

  it("empieza con el prefijo 'PN-'", () => {
    const numero = generarNumeroPedido();
    expect(numero.startsWith("PN-")).toBe(true);
  });

  it("el año presente en el número es el año actual", () => {
    const anioActual = new Date().getFullYear().toString();
    const numero = generarNumeroPedido();
    // Format: PN-2026-XXXXXX  → partes[1] is the year
    const partes = numero.split("-");
    expect(partes[1]).toBe(anioActual);
  });

  it("el sufijo tiene exactamente 6 caracteres", () => {
    const numero = generarNumeroPedido();
    const sufijo = numero.split("-")[2];
    expect(sufijo).toHaveLength(6);
  });

  it("el sufijo contiene solo caracteres del alfabeto permitido (sin 0 O 1 I)", () => {
    // Test 20 samples for better statistical coverage
    const caracteresProhibidos = /[01IO]/;
    for (let i = 0; i < 20; i++) {
      const numero = generarNumeroPedido();
      const sufijo = numero.split("-")[2];
      expect(sufijo).not.toMatch(caracteresProhibidos);
    }
  });

  it("el sufijo no contiene minúsculas", () => {
    for (let i = 0; i < 20; i++) {
      const numero = generarNumeroPedido();
      const sufijo = numero.split("-")[2];
      expect(sufijo).toBe(sufijo.toUpperCase());
    }
  });

  it("50 llamadas consecutivas producen más de un valor único (aleatoriedad)", () => {
    const numeros = new Set<string>();
    for (let i = 0; i < 50; i++) {
      numeros.add(generarNumeroPedido());
    }
    // With 50 calls and ~10^9 possible combinations, the probability that
    // all of them are equal is astronomically low. We require at least 2 unique ones.
    expect(numeros.size).toBeGreaterThan(1);
  });

  it("dos llamadas consecutivas tienen estructura idéntica (misma longitud y prefijo)", () => {
    const a = generarNumeroPedido();
    const b = generarNumeroPedido();
    expect(a.length).toBe(b.length);
    expect(a.substring(0, 8)).toBe("PN-" + new Date().getFullYear().toString() + "-");
  });

  it("el número completo tiene exactamente 14 caracteres (PN-YYYY-XXXXXX)", () => {
    // "PN-" (3) + 4 digits of the year + "-" (1) + 6 of the suffix = 14
    const numero = generarNumeroPedido();
    expect(numero).toHaveLength(14);
  });
});
