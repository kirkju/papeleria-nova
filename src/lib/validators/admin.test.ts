/**
 * Tests for the admin validators (PURE): state machine and TOTAL
 * parsers for the product and order filters.
 *
 * Covers:
 *  - TRANSICIONES_PEDIDO: full matrix of valid and invalid pairs.
 *  - puedeTransicionar: equal statuses => false (all 5 statuses).
 *  - ESTADOS_PRODUCTO_FILTRO / ORDENES_PRODUCTO: exported values.
 *  - parsearFiltrosProductos: defaults, valid values, garbage, arrays, q with trim,
 *    negative page, empty cat => undefined.
 *  - parsearFiltrosPedidos: defaults, all valid OrderStatus values, ISO dates,
 *    date-only date (YYYY-MM-DD), valid hasta, q with spaces, garbage page.
 */
import { describe, it, expect } from "vitest";
import {
  TRANSICIONES_PEDIDO,
  puedeTransicionar,
  parsearFiltrosProductos,
  parsearFiltrosPedidos,
  UMBRAL_STOCK_BAJO,
  ESTADOS_PRODUCTO_FILTRO,
  ORDENES_PRODUCTO,
  ESTADOS_PEDIDO_FILTRO,
  TAMANO_PAGINA_ADMIN,
} from "./admin";

// ── State machine ─────────────────────────────────────────────────────────────

describe("máquina de estados de pedido", () => {
  it("tiene las transiciones esperadas", () => {
    expect(TRANSICIONES_PEDIDO.PENDIENTE).toEqual(["PAGADO", "CANCELADO"]);
    expect(TRANSICIONES_PEDIDO.PAGADO).toEqual(["ENVIADO", "CANCELADO"]);
    expect(TRANSICIONES_PEDIDO.ENVIADO).toEqual(["ENTREGADO"]);
    expect(TRANSICIONES_PEDIDO.ENTREGADO).toEqual([]);
    expect(TRANSICIONES_PEDIDO.CANCELADO).toEqual([]);
  });

  it("puedeTransicionar permite TODAS las transiciones válidas (tabla completa)", () => {
    // PENDIENTE -> PAGADO | CANCELADO
    expect(puedeTransicionar("PENDIENTE", "PAGADO")).toBe(true);
    expect(puedeTransicionar("PENDIENTE", "CANCELADO")).toBe(true);
    // PAGADO -> ENVIADO | CANCELADO
    expect(puedeTransicionar("PAGADO", "ENVIADO")).toBe(true);
    expect(puedeTransicionar("PAGADO", "CANCELADO")).toBe(true);
    // ENVIADO -> ENTREGADO (the only one)
    expect(puedeTransicionar("ENVIADO", "ENTREGADO")).toBe(true);
  });

  it("puedeTransicionar rechaza inválidas (saltos ilegales)", () => {
    // Forward jumps that skip statuses
    expect(puedeTransicionar("PENDIENTE", "ENVIADO")).toBe(false);
    expect(puedeTransicionar("PENDIENTE", "ENTREGADO")).toBe(false);
    expect(puedeTransicionar("PAGADO", "ENTREGADO")).toBe(false);
    // Backward jumps
    expect(puedeTransicionar("PAGADO", "PENDIENTE")).toBe(false);
    expect(puedeTransicionar("ENVIADO", "PAGADO")).toBe(false);
    expect(puedeTransicionar("ENTREGADO", "ENVIADO")).toBe(false);
    expect(puedeTransicionar("CANCELADO", "PENDIENTE")).toBe(false);
    expect(puedeTransicionar("CANCELADO", "PAGADO")).toBe(false);
    // Terminal statuses with no way out
    expect(puedeTransicionar("ENTREGADO", "CANCELADO")).toBe(false);
    expect(puedeTransicionar("ENTREGADO", "PENDIENTE")).toBe(false);
    expect(puedeTransicionar("CANCELADO", "ENVIADO")).toBe(false);
    expect(puedeTransicionar("CANCELADO", "ENTREGADO")).toBe(false);
  });

  it("puedeTransicionar con el MISMO estado siempre devuelve false (5 estados)", () => {
    expect(puedeTransicionar("PENDIENTE", "PENDIENTE")).toBe(false);
    expect(puedeTransicionar("PAGADO", "PAGADO")).toBe(false);
    expect(puedeTransicionar("ENVIADO", "ENVIADO")).toBe(false);
    expect(puedeTransicionar("ENTREGADO", "ENTREGADO")).toBe(false);
    expect(puedeTransicionar("CANCELADO", "CANCELADO")).toBe(false);
  });

  it("ENVIADO no puede cancelarse (solo puede entregarse)", () => {
    expect(puedeTransicionar("ENVIADO", "CANCELADO")).toBe(false);
  });
});

// ── Exported constants ───────────────────────────────────────────────────────

describe("UMBRAL_STOCK_BAJO", () => {
  it("es 5", () => {
    expect(UMBRAL_STOCK_BAJO).toBe(5);
  });
});

describe("TAMANO_PAGINA_ADMIN", () => {
  it("es 12", () => {
    expect(TAMANO_PAGINA_ADMIN).toBe(12);
  });
});

describe("ESTADOS_PRODUCTO_FILTRO", () => {
  it("contiene los 4 estados esperados", () => {
    expect(ESTADOS_PRODUCTO_FILTRO).toContain("todos");
    expect(ESTADOS_PRODUCTO_FILTRO).toContain("activos");
    expect(ESTADOS_PRODUCTO_FILTRO).toContain("inactivos");
    expect(ESTADOS_PRODUCTO_FILTRO).toContain("stock-bajo");
    expect(ESTADOS_PRODUCTO_FILTRO).toHaveLength(4);
  });
});

describe("ORDENES_PRODUCTO", () => {
  it("contiene los 4 órdenes con value y label", () => {
    const valores = ORDENES_PRODUCTO.map((o) => o.value);
    expect(valores).toContain("recientes");
    expect(valores).toContain("nombre");
    expect(valores).toContain("precio");
    expect(valores).toContain("stock");
    expect(ORDENES_PRODUCTO).toHaveLength(4);
    // All of them must have a Spanish label
    ORDENES_PRODUCTO.forEach((o) => {
      expect(typeof o.label).toBe("string");
      expect(o.label.length).toBeGreaterThan(0);
    });
  });
});

describe("ESTADOS_PEDIDO_FILTRO", () => {
  it("incluye 'todos' y todos los OrderStatus", () => {
    expect(ESTADOS_PEDIDO_FILTRO).toContain("todos");
    expect(ESTADOS_PEDIDO_FILTRO).toContain("PENDIENTE");
    expect(ESTADOS_PEDIDO_FILTRO).toContain("PAGADO");
    expect(ESTADOS_PEDIDO_FILTRO).toContain("ENVIADO");
    expect(ESTADOS_PEDIDO_FILTRO).toContain("ENTREGADO");
    expect(ESTADOS_PEDIDO_FILTRO).toContain("CANCELADO");
    expect(ESTADOS_PEDIDO_FILTRO).toHaveLength(6);
  });
});

// ── Product filters ───────────────────────────────────────────────────────────

describe("parsearFiltrosProductos", () => {
  it("devuelve defaults con entrada vacía", () => {
    const f = parsearFiltrosProductos({});
    expect(f.q).toBeUndefined();
    expect(f.cat).toBeUndefined();
    expect(f.estado).toBe("todos");
    expect(f.orden).toBe("recientes");
    expect(f.page).toBe(1);
  });

  it("acepta todos los valores válidos", () => {
    const f = parsearFiltrosProductos({
      q: "  lápiz ",
      cat: "escritura",
      estado: "stock-bajo",
      orden: "precio",
      page: "3",
    });
    expect(f.q).toBe("lápiz");
    expect(f.cat).toBe("escritura");
    expect(f.estado).toBe("stock-bajo");
    expect(f.orden).toBe("precio");
    expect(f.page).toBe(3);
  });

  it("acepta todos los valores de estado y orden", () => {
    expect(parsearFiltrosProductos({ estado: "activos" }).estado).toBe("activos");
    expect(parsearFiltrosProductos({ estado: "inactivos" }).estado).toBe("inactivos");
    expect(parsearFiltrosProductos({ estado: "stock-bajo" }).estado).toBe("stock-bajo");
    expect(parsearFiltrosProductos({ orden: "nombre" }).orden).toBe("nombre");
    expect(parsearFiltrosProductos({ orden: "stock" }).orden).toBe("stock");
  });

  it("cae a default ante valores basura (parser TOTAL, nunca lanza)", () => {
    const f = parsearFiltrosProductos({
      estado: "inventado",
      orden: "xyz",
      page: "abc",
    });
    expect(f.estado).toBe("todos");
    expect(f.orden).toBe("recientes");
    expect(f.page).toBe(1);
  });

  it("page negativa cae a 1 (mínimo es 1)", () => {
    expect(parsearFiltrosProductos({ page: "-3" }).page).toBe(1);
    expect(parsearFiltrosProductos({ page: "0" }).page).toBe(1);
  });

  it("q vacío tras trim queda undefined", () => {
    expect(parsearFiltrosProductos({ q: "   " }).q).toBeUndefined();
    expect(parsearFiltrosProductos({ q: "" }).q).toBeUndefined();
  });

  it("cat vacía tras trim queda undefined", () => {
    expect(parsearFiltrosProductos({ cat: "" }).cat).toBeUndefined();
    expect(parsearFiltrosProductos({ cat: "   " }).cat).toBeUndefined();
  });

  it("usa el primer valor si el param viene repetido como array", () => {
    expect(parsearFiltrosProductos({ page: ["2", "9"] }).page).toBe(2);
    expect(parsearFiltrosProductos({ q: ["cuaderno", "libreta"] }).q).toBe("cuaderno");
    expect(parsearFiltrosProductos({ estado: ["activos", "inactivos"] }).estado).toBe("activos");
  });

  it("nunca lanza con cualquier combinación de basura", () => {
    expect(() =>
      parsearFiltrosProductos({
        q: ["", "   "],
        cat: undefined,
        estado: "INVENTADO",
        orden: ["???", "otro"],
        page: ["-5", "abc"],
      }),
    ).not.toThrow();
  });
});

// ── Order filters ─────────────────────────────────────────────────────────────

describe("parsearFiltrosPedidos", () => {
  it("devuelve defaults con entrada vacía", () => {
    const f = parsearFiltrosPedidos({});
    expect(f.q).toBeUndefined();
    expect(f.estado).toBe("todos");
    expect(f.desde).toBeUndefined();
    expect(f.hasta).toBeUndefined();
    expect(f.page).toBe(1);
  });

  it("acepta estado OrderStatus y fechas ISO válidas", () => {
    const f = parsearFiltrosPedidos({
      q: "PN-2026",
      estado: "PAGADO",
      desde: "2026-06-01",
      hasta: "2026-06-30",
      page: "2",
    });
    expect(f.q).toBe("PN-2026");
    expect(f.estado).toBe("PAGADO");
    expect(f.desde).toBe("2026-06-01");
    expect(f.hasta).toBe("2026-06-30");
    expect(f.page).toBe(2);
  });

  it("acepta todos los OrderStatus como estado de filtro", () => {
    expect(parsearFiltrosPedidos({ estado: "PENDIENTE" }).estado).toBe("PENDIENTE");
    expect(parsearFiltrosPedidos({ estado: "PAGADO" }).estado).toBe("PAGADO");
    expect(parsearFiltrosPedidos({ estado: "ENVIADO" }).estado).toBe("ENVIADO");
    expect(parsearFiltrosPedidos({ estado: "ENTREGADO" }).estado).toBe("ENTREGADO");
    expect(parsearFiltrosPedidos({ estado: "CANCELADO" }).estado).toBe("CANCELADO");
    expect(parsearFiltrosPedidos({ estado: "todos" }).estado).toBe("todos");
  });

  it("acepta fecha solo-fecha YYYY-MM-DD como ISO parcial válido", () => {
    const f = parsearFiltrosPedidos({ desde: "2026-01-15", hasta: "2026-12-31" });
    expect(f.desde).toBe("2026-01-15");
    expect(f.hasta).toBe("2026-12-31");
  });

  it("descarta fechas inválidas sin lanzar (hasta conserva si desde es inválido)", () => {
    const f = parsearFiltrosPedidos({
      desde: "no-es-fecha",
      hasta: "2026-06-30",
    });
    expect(f.desde).toBeUndefined();
    expect(f.hasta).toBe("2026-06-30");
  });

  it("descarta estado inventado sin lanzar", () => {
    const f = parsearFiltrosPedidos({ estado: "SUPER_PAGADO" });
    expect(f.estado).toBe("todos");
  });

  it("q con espacios se recorta y se conserva", () => {
    expect(parsearFiltrosPedidos({ q: "  PN-2026-ABC  " }).q).toBe("PN-2026-ABC");
  });

  it("q vacío tras trim queda undefined", () => {
    expect(parsearFiltrosPedidos({ q: "   " }).q).toBeUndefined();
  });

  it("page inválida cae a 1", () => {
    expect(parsearFiltrosPedidos({ page: "abc" }).page).toBe(1);
    expect(parsearFiltrosPedidos({ page: "-1" }).page).toBe(1);
    expect(parsearFiltrosPedidos({ page: "0" }).page).toBe(1);
  });

  it("usa el primer valor si el param viene repetido como array", () => {
    expect(parsearFiltrosPedidos({ page: ["3", "7"] }).page).toBe(3);
    expect(parsearFiltrosPedidos({ estado: ["PAGADO", "ENVIADO"] }).estado).toBe("PAGADO");
  });

  it("nunca lanza con cualquier combinación de basura", () => {
    expect(() =>
      parsearFiltrosPedidos({
        q: ["", null as unknown as string],
        estado: "INVENTADO",
        desde: "fecha-invalida",
        hasta: "otra-invalida",
        page: ["xyz"],
      }),
    ).not.toThrow();
  });
});
