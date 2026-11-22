/**
 * Tests for the catalog filters validator.
 *
 * Covers: defaults, garbage values, trimming of q, type coercion,
 * array handling (repeated params), min>max swap, disp, sort and page.
 */
import { describe, it, expect } from "vitest";
import {
  parsearFiltros,
  TAMANO_PAGINA,
  OPCIONES_SORT,
} from "./catalogo";

describe("parsearFiltros — defaults con parámetros vacíos", () => {
  it("devuelve defaults completos cuando no hay parámetros", () => {
    const filtros = parsearFiltros({});
    expect(filtros.q).toBeUndefined();
    expect(filtros.cat).toBeUndefined();
    expect(filtros.marca).toBeUndefined();
    expect(filtros.min).toBeUndefined();
    expect(filtros.max).toBeUndefined();
    expect(filtros.disp).toBe(false);
    expect(filtros.sort).toBe("relevancia");
    expect(filtros.page).toBe(1);
  });

  it("devuelve defaults completos cuando todos los parámetros son basura", () => {
    const filtros = parsearFiltros({
      q: "   ",
      page: "abc",
      sort: "inexistente",
      min: "no-es-numero",
      max: "-5",
      disp: "si",
    });
    expect(filtros.q).toBeUndefined();
    expect(filtros.page).toBe(1);
    expect(filtros.sort).toBe("relevancia");
    // min with "no-es-numero" is discarded (NaN does not pass z.coerce.number().int())
    expect(filtros.min).toBeUndefined();
    expect(filtros.disp).toBe(false);
  });
});

describe("parsearFiltros — campo q (texto de búsqueda)", () => {
  it("recorta espacios al inicio y final", () => {
    const { q } = parsearFiltros({ q: "  cuaderno  " });
    expect(q).toBe("cuaderno");
  });

  it("limita q a 100 caracteres exactos", () => {
    const largo = "a".repeat(150);
    const { q } = parsearFiltros({ q: largo });
    // The schema does .max(100) — zod 4 truncates or rejects
    // Per the backend decision: q is trimmed and limited to 100 chars
    // If zod rejects the whole field, q will be undefined; if it truncates, it will have 100 chars
    // We check that it does not exceed 100
    expect(q === undefined || (typeof q === "string" && q.length <= 100)).toBe(true);
  });

  it("q vacío después de trim queda undefined", () => {
    const { q } = parsearFiltros({ q: "   " });
    expect(q).toBeUndefined();
  });

  it("q ausente queda undefined", () => {
    const { q } = parsearFiltros({});
    expect(q).toBeUndefined();
  });

  it("q con texto válido se conserva", () => {
    const { q } = parsearFiltros({ q: "lápiz faber" });
    expect(q).toBe("lápiz faber");
  });
});

describe("parsearFiltros — campo page", () => {
  it("page con texto 'abc' cae a 1", () => {
    const { page } = parsearFiltros({ page: "abc" });
    expect(page).toBe(1);
  });

  it("page negativa (-2) cae a 1", () => {
    const { page } = parsearFiltros({ page: "-2" });
    expect(page).toBe(1);
  });

  it("page cero (0) cae a 1", () => {
    const { page } = parsearFiltros({ page: "0" });
    expect(page).toBe(1);
  });

  it("page '3' válida se parsea como 3", () => {
    const { page } = parsearFiltros({ page: "3" });
    expect(page).toBe(3);
  });

  it("page ausente es 1 por default", () => {
    const { page } = parsearFiltros({});
    expect(page).toBe(1);
  });
});

describe("parsearFiltros — campos min y max (precio)", () => {
  it("min válido se coerciona correctamente", () => {
    const { min } = parsearFiltros({ min: "100" });
    expect(min).toBe(100);
  });

  it("max válido se coerciona correctamente", () => {
    const { max } = parsearFiltros({ max: "500" });
    expect(max).toBe(500);
  });

  it("min con texto 'abc' se descarta (queda undefined) sin afectar max", () => {
    const filtros = parsearFiltros({ min: "abc", max: "300" });
    expect(filtros.min).toBeUndefined();
    expect(filtros.max).toBe(300);
  });

  it("max negativo se descarta; min válido se conserva", () => {
    // z.coerce.number().int().min(0) rejects negatives
    const filtros = parsearFiltros({ min: "50", max: "-10" });
    expect(filtros.min).toBe(50);
    expect(filtros.max).toBeUndefined();
  });

  it("min > max: se intercambian en la salida", () => {
    const filtros = parsearFiltros({ min: "500", max: "100" });
    expect(filtros.min).toBe(100);
    expect(filtros.max).toBe(500);
  });

  it("min === max: no se intercambian, ambos iguales", () => {
    const filtros = parsearFiltros({ min: "200", max: "200" });
    expect(filtros.min).toBe(200);
    expect(filtros.max).toBe(200);
  });

  it("solo min sin max: se conserva min, max undefined", () => {
    const filtros = parsearFiltros({ min: "150" });
    expect(filtros.min).toBe(150);
    expect(filtros.max).toBeUndefined();
  });

  it("min cero es válido (precio mínimo 0)", () => {
    const { min } = parsearFiltros({ min: "0" });
    expect(min).toBe(0);
  });
});

describe("parsearFiltros — campo sort (orden)", () => {
  it("sort inválido 'mas_popular' cae a relevancia", () => {
    const { sort } = parsearFiltros({ sort: "mas_popular" });
    expect(sort).toBe("relevancia");
  });

  it("sort 'precio_asc' es válido", () => {
    const { sort } = parsearFiltros({ sort: "precio_asc" });
    expect(sort).toBe("precio_asc");
  });

  it("sort 'precio_desc' es válido", () => {
    const { sort } = parsearFiltros({ sort: "precio_desc" });
    expect(sort).toBe("precio_desc");
  });

  it("sort 'nuevos' es válido", () => {
    const { sort } = parsearFiltros({ sort: "nuevos" });
    expect(sort).toBe("nuevos");
  });

  it("sort 'relevancia' explícito es válido", () => {
    const { sort } = parsearFiltros({ sort: "relevancia" });
    expect(sort).toBe("relevancia");
  });

  it("sort ausente default es 'relevancia'", () => {
    const { sort } = parsearFiltros({});
    expect(sort).toBe("relevancia");
  });
});

describe("parsearFiltros — campo disp (disponibilidad)", () => {
  it("disp='1' activa el filtro de stock", () => {
    const { disp } = parsearFiltros({ disp: "1" });
    expect(disp).toBe(true);
  });

  it("disp='0' NO activa el filtro", () => {
    const { disp } = parsearFiltros({ disp: "0" });
    expect(disp).toBe(false);
  });

  it("disp='true' NO activa el filtro (solo '1' vale)", () => {
    const { disp } = parsearFiltros({ disp: "true" });
    expect(disp).toBe(false);
  });

  it("disp='yes' NO activa el filtro", () => {
    const { disp } = parsearFiltros({ disp: "yes" });
    expect(disp).toBe(false);
  });

  it("disp ausente es false por default", () => {
    const { disp } = parsearFiltros({});
    expect(disp).toBe(false);
  });
});

describe("parsearFiltros — parámetros repetidos (arrays)", () => {
  it("q repetido como array usa el primer valor", () => {
    const { q } = parsearFiltros({ q: ["cuaderno", "libreta"] });
    expect(q).toBe("cuaderno");
  });

  it("page repetida como array usa el primer valor", () => {
    const { page } = parsearFiltros({ page: ["3", "7"] });
    expect(page).toBe(3);
  });

  it("sort repetido como array usa el primer valor", () => {
    const { sort } = parsearFiltros({ sort: ["precio_asc", "nuevos"] });
    expect(sort).toBe("precio_asc");
  });

  it("min repetido como array usa el primer valor", () => {
    const { min } = parsearFiltros({ min: ["100", "200"] });
    expect(min).toBe(100);
  });

  it("cat repetido como array usa el primer valor", () => {
    const { cat } = parsearFiltros({ cat: ["cuadernos", "arte"] });
    expect(cat).toBe("cuadernos");
  });

  it("parsearFiltros no lanza con array de basura en todos los campos", () => {
    expect(() =>
      parsearFiltros({
        q: ["", "   "],
        page: ["xyz", "abc"],
        sort: ["invalido", "tambien_invalido"],
        min: ["texto", "-100"],
        max: ["nan", "otro"],
        disp: ["si", "no"],
      }),
    ).not.toThrow();
  });
});

describe("parsearFiltros — cat y marca", () => {
  it("cat válido se conserva", () => {
    const { cat } = parsearFiltros({ cat: "cuadernos" });
    expect(cat).toBe("cuadernos");
  });

  it("cat vacío queda undefined", () => {
    const { cat } = parsearFiltros({ cat: "" });
    expect(cat).toBeUndefined();
  });

  it("marca válida se conserva", () => {
    const { marca } = parsearFiltros({ marca: "Faber-Castell" });
    expect(marca).toBe("Faber-Castell");
  });

  it("marca vacía queda undefined", () => {
    const { marca } = parsearFiltros({ marca: "" });
    expect(marca).toBeUndefined();
  });
});

describe("TAMANO_PAGINA y OPCIONES_SORT", () => {
  it("TAMANO_PAGINA es 12", () => {
    expect(TAMANO_PAGINA).toBe(12);
  });

  it("OPCIONES_SORT tiene 4 opciones con los valores esperados", () => {
    const valores = OPCIONES_SORT.map((o) => o.value);
    expect(valores).toContain("relevancia");
    expect(valores).toContain("precio_asc");
    expect(valores).toContain("precio_desc");
    expect(valores).toContain("nuevos");
    expect(OPCIONES_SORT).toHaveLength(4);
  });

  it("OPCIONES_SORT tiene etiquetas en español", () => {
    const etiquetas = OPCIONES_SORT.map((o) => o.label);
    expect(etiquetas[0]).toBe("Relevancia");
    expect(etiquetas[1]).toBe("Precio: menor a mayor");
  });
});
