/**
 * Tests for the admin date helpers (PURE).
 *
 * Covers:
 *  - rangoHoy: exact bounds, does not mutate the argument.
 *  - rangoMesActual / rangoMesAnterior: normal month, year crossing (January/December).
 *  - agruparVentasPorDia: series of exactly N points, ascending order, DD/MM labels,
 *    sum per day, ISO strings, orders outside the window ignored, invalid dates
 *    ignored, dias<=0 gives empty, dias=1 (a single point), several orders on the same day.
 *  - variacionPorcentual: positive, negative, zero, rounding to 1 decimal, base=0 => null.
 *  - inicioDelDia: does not mutate the argument, correct result.
 */
import { describe, it, expect } from "vitest";
import {
  rangoHoy,
  rangoMesActual,
  rangoMesAnterior,
  agruparVentasPorDia,
  variacionPorcentual,
  inicioDelDia,
} from "./fechas";

// Fixed clock for determinism: June 15, 2026, 14:30 (local time).
const AHORA = new Date(2026, 5, 15, 14, 30, 0, 0);

describe("rangoHoy", () => {
  it("va de medianoche de hoy a medianoche de mañana", () => {
    const { inicio, fin } = rangoHoy(AHORA);
    expect(inicio.getTime()).toBe(new Date(2026, 5, 15, 0, 0, 0, 0).getTime());
    expect(fin.getTime()).toBe(new Date(2026, 5, 16, 0, 0, 0, 0).getTime());
  });

  it("el rango dura exactamente 24 horas (en ms)", () => {
    const { inicio, fin } = rangoHoy(AHORA);
    expect(fin.getTime() - inicio.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it("no muta el argumento recibido", () => {
    const ahora = new Date(2026, 5, 15, 14, 30);
    const t = ahora.getTime();
    rangoHoy(ahora);
    expect(ahora.getTime()).toBe(t);
  });
});

describe("rangoMesActual / rangoMesAnterior", () => {
  it("mes actual: del 1 de junio al 1 de julio", () => {
    const { inicio, fin } = rangoMesActual(AHORA);
    expect(inicio.getTime()).toBe(new Date(2026, 5, 1).getTime());
    expect(fin.getTime()).toBe(new Date(2026, 6, 1).getTime());
  });

  it("mes anterior: del 1 de mayo al 1 de junio", () => {
    const { inicio, fin } = rangoMesAnterior(AHORA);
    expect(inicio.getTime()).toBe(new Date(2026, 4, 1).getTime());
    expect(fin.getTime()).toBe(new Date(2026, 5, 1).getTime());
  });

  it("mes anterior cruza año correctamente en enero (diciembre del año previo)", () => {
    const enero = new Date(2026, 0, 10);
    const { inicio, fin } = rangoMesAnterior(enero);
    expect(inicio.getTime()).toBe(new Date(2025, 11, 1).getTime());
    expect(fin.getTime()).toBe(new Date(2026, 0, 1).getTime());
  });

  it("mes actual en diciembre: fin es el 1 de enero del año siguiente", () => {
    const diciembre = new Date(2026, 11, 20);
    const { inicio, fin } = rangoMesActual(diciembre);
    expect(inicio.getTime()).toBe(new Date(2026, 11, 1).getTime());
    expect(fin.getTime()).toBe(new Date(2027, 0, 1).getTime());
  });

  it("el rango del mes actual comienza a las 00:00:00.000 (inicio exacto)", () => {
    const { inicio } = rangoMesActual(AHORA);
    expect(inicio.getHours()).toBe(0);
    expect(inicio.getMinutes()).toBe(0);
    expect(inicio.getSeconds()).toBe(0);
    expect(inicio.getMilliseconds()).toBe(0);
    expect(inicio.getDate()).toBe(1);
  });

  it("el fin del rango del mes es semiabierto (exclusivo: primer día del mes siguiente)", () => {
    // The end must be day 1 of the next month, to use with lt in Prisma.
    const { fin } = rangoMesActual(AHORA);
    expect(fin.getMonth()).toBe(6); // July (index 6)
    expect(fin.getDate()).toBe(1);
  });
});

describe("agruparVentasPorDia", () => {
  it("genera exactamente N puntos en orden cronológico ascendente", () => {
    const serie = agruparVentasPorDia([], 7, AHORA);
    expect(serie).toHaveLength(7);
    expect(serie[serie.length - 1].fecha).toBe("15/06"); // today at the end
    expect(serie[0].fecha).toBe("09/06"); // 6 days ago
  });

  it("serie de 1 día contiene solo hoy con fecha correcta", () => {
    const serie = agruparVentasPorDia([], 1, AHORA);
    expect(serie).toHaveLength(1);
    expect(serie[0].fecha).toBe("15/06");
    expect(serie[0].monto).toBe(0);
  });

  it("rellena con 0 los días sin ventas", () => {
    const serie = agruparVentasPorDia([], 3, AHORA);
    expect(serie.every((p) => p.monto === 0)).toBe(true);
  });

  it("etiquetas tienen formato DD/MM (con cero a la izquierda)", () => {
    // 7-day window going back from 15/06: 09/06..15/06
    const serie = agruparVentasPorDia([], 7, AHORA);
    serie.forEach((p) => {
      expect(p.fecha).toMatch(/^\d{2}\/\d{2}$/);
    });
  });

  it("agrupa y suma las ventas del mismo día correctamente", () => {
    const pedidos = [
      { creadoEn: new Date(2026, 5, 15, 9, 0), total: 100 },
      { creadoEn: new Date(2026, 5, 15, 18, 0), total: 250 },
      { creadoEn: new Date(2026, 5, 14, 12, 0), total: 80 },
    ];
    const serie = agruparVentasPorDia(pedidos, 3, AHORA);
    const hoy = serie.find((p) => p.fecha === "15/06");
    const ayer = serie.find((p) => p.fecha === "14/06");
    expect(hoy?.monto).toBe(350);
    expect(ayer?.monto).toBe(80);
  });

  it("múltiples pedidos del mismo día (más de 2) se acumulan todos", () => {
    const pedidos = [
      { creadoEn: new Date(2026, 5, 15, 8, 0), total: 50 },
      { creadoEn: new Date(2026, 5, 15, 12, 0), total: 75 },
      { creadoEn: new Date(2026, 5, 15, 20, 0), total: 125 },
    ];
    const serie = agruparVentasPorDia(pedidos, 1, AHORA);
    expect(serie[0].monto).toBe(250);
  });

  it("acepta fechas como ISO string", () => {
    const iso = new Date(2026, 5, 15, 10, 0).toISOString();
    const serie = agruparVentasPorDia([{ creadoEn: iso, total: 500 }], 2, AHORA);
    expect(serie.find((p) => p.fecha === "15/06")?.monto).toBe(500);
  });

  it("ignora ventas fuera de la ventana de días (anteriores al primer día)", () => {
    // 3-day window: 13/06, 14/06, 15/06. 01/06 falls outside.
    const pedidos = [{ creadoEn: new Date(2026, 5, 1), total: 999 }];
    const serie = agruparVentasPorDia(pedidos, 3, AHORA);
    expect(serie.reduce((acc, p) => acc + p.monto, 0)).toBe(0);
  });

  it("pedido de hoy a medianoche (00:00) sí entra en la ventana", () => {
    const medianoche = new Date(2026, 5, 15, 0, 0, 0, 0);
    const serie = agruparVentasPorDia([{ creadoEn: medianoche, total: 300 }], 1, AHORA);
    expect(serie[0].monto).toBe(300);
  });

  it("ignora fechas inválidas sin romper (silenciosamente)", () => {
    const serie = agruparVentasPorDia(
      [{ creadoEn: "no-es-fecha", total: 100 }],
      3,
      AHORA,
    );
    expect(serie.reduce((acc, p) => acc + p.monto, 0)).toBe(0);
  });

  it("devuelve serie vacía si dias es 0", () => {
    expect(agruparVentasPorDia([], 0, AHORA)).toEqual([]);
  });

  it("devuelve serie vacía si dias es negativo", () => {
    expect(agruparVentasPorDia([], -5, AHORA)).toEqual([]);
  });

  it("pedidos con total 0 no corrompen la suma (contribuyen 0)", () => {
    const pedidos = [
      { creadoEn: new Date(2026, 5, 15, 9, 0), total: 0 },
      { creadoEn: new Date(2026, 5, 15, 10, 0), total: 200 },
    ];
    const serie = agruparVentasPorDia(pedidos, 1, AHORA);
    expect(serie[0].monto).toBe(200);
  });

  it("total no finito (NaN) se trata como 0 y no corrompe otros totales", () => {
    const pedidos = [
      { creadoEn: new Date(2026, 5, 15, 9, 0), total: NaN },
      { creadoEn: new Date(2026, 5, 15, 10, 0), total: 150 },
    ];
    const serie = agruparVentasPorDia(pedidos, 1, AHORA);
    // NaN is treated as 0: day total = 0 + 150 = 150
    expect(serie[0].monto).toBe(150);
  });
});

describe("variacionPorcentual", () => {
  it("calcula cambio positivo correctamente", () => {
    expect(variacionPorcentual(150, 100)).toBe(50);
    expect(variacionPorcentual(200, 100)).toBe(100);
  });

  it("calcula cambio negativo correctamente", () => {
    expect(variacionPorcentual(50, 100)).toBe(-50);
    expect(variacionPorcentual(0, 100)).toBe(-100);
  });

  it("redondea a 1 decimal (no 0 decimales ni más de 1)", () => {
    // 133.33... %, rounding to 1 decimal = 33.3
    expect(variacionPorcentual(133, 100)).toBe(33);
    // (1/3) * 100 = 33.333... -> rounds to 33.3
    expect(variacionPorcentual(1, 3)).toBe(-66.7);
    // 1 -> 1.5: exactly +50.0
    expect(variacionPorcentual(150, 100)).toBe(50);
  });

  it("devuelve null cuando la base anterior es 0 (no existe referencia)", () => {
    expect(variacionPorcentual(500, 0)).toBeNull();
    expect(variacionPorcentual(0, 0)).toBeNull();
    expect(variacionPorcentual(1, 0)).toBeNull();
  });

  it("devuelve 0 cuando no hubo cambio", () => {
    expect(variacionPorcentual(100, 100)).toBe(0);
    expect(variacionPorcentual(0, 0)).toBeNull(); // special case: base=0
  });

  it("el resultado es number (no null) cuando anterior > 0", () => {
    const resultado = variacionPorcentual(200, 150);
    expect(resultado).not.toBeNull();
    expect(typeof resultado).toBe("number");
  });
});

describe("inicioDelDia", () => {
  it("no muta el argumento original", () => {
    const original = new Date(2026, 5, 15, 14, 30);
    const t = original.getTime();
    inicioDelDia(original);
    expect(original.getTime()).toBe(t);
  });

  it("retorna una fecha con horas/minutos/segundos/ms en cero", () => {
    const result = inicioDelDia(new Date(2026, 5, 15, 23, 59, 59, 999));
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
  });

  it("conserva la misma fecha (día, mes, año)", () => {
    const result = inicioDelDia(new Date(2026, 5, 15, 14, 30));
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(15);
  });

  it("aplicado a medianoche devuelve la misma medianoche", () => {
    const medianoche = new Date(2026, 5, 15, 0, 0, 0, 0);
    const result = inicioDelDia(medianoche);
    expect(result.getTime()).toBe(medianoche.getTime());
  });
});
