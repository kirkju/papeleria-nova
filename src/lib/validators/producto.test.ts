/**
 * Tests for the product FormData validator.
 *
 * Covers: happy case, slug derivation, empty slug => derived from the name,
 * slug with uppercase/spaces normalized to lowercase by the schema (then
 * rejected if it is still invalid), comparePrice > precio rule (including ==),
 * precio "abc"/negative/0/too large, stock decimal/negative/valid zero,
 * empty categoryId, checkboxes "1"/absent, trims on nombre/sku/marca, error
 * messages in Spanish.
 */
import { describe, it, expect } from "vitest";
import { parsearProducto } from "./producto";

/** Builds a FormData with the valid base fields + overrides. */
function fd(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    nombre: "Lápiz HB premium",
    descripcion: "Lápiz de grafito de alta calidad para escritura y dibujo.",
    precio: "12.50",
    sku: "LAP-HB-001",
    stock: "30",
    categoryId: "cat_escritura",
  };
  const datos = { ...base, ...overrides };
  const form = new FormData();
  for (const [k, v] of Object.entries(datos)) {
    if (v !== "__OMITIR__") form.set(k, v);
  }
  return form;
}

describe("parsearProducto — caso feliz", () => {
  it("valida un producto completo y deriva el slug del nombre", () => {
    const res = parsearProducto(fd());
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.slug).toBe("lapiz-hb-premium");
    expect(res.data.precio).toBe("12.50");
    expect(res.data.stock).toBe(30);
    expect(res.data.activo).toBe(false); // no checkbox => false
    expect(res.data.destacado).toBe(false);
    expect(res.data.marca).toBeUndefined();
    expect(res.data.comparePrice).toBeUndefined();
    expect(res.data.imagenUrl).toBeUndefined();
  });

  it("respeta un slug provisto en kebab-case", () => {
    const res = parsearProducto(fd({ slug: "mi-slug-custom" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.slug).toBe("mi-slug-custom");
  });

  it("interpreta los checkboxes activo/destacado = '1' como true", () => {
    const res = parsearProducto(fd({ activo: "1", destacado: "1" }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.activo).toBe(true);
      expect(res.data.destacado).toBe(true);
    }
  });

  it("acepta marca e imagen local opcionales", () => {
    const res = parsearProducto(
      fd({ marca: "Faber-Castell", imagenUrl: "/productos/lapiz.webp" }),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.marca).toBe("Faber-Castell");
      expect(res.data.imagenUrl).toBe("/productos/lapiz.webp");
    }
  });
});

describe("parsearProducto — comparePrice", () => {
  it("acepta comparePrice mayor al precio", () => {
    const res = parsearProducto(fd({ precio: "12.50", comparePrice: "18.00" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.comparePrice).toBe("18.00");
  });

  it("rechaza comparePrice menor al precio", () => {
    const res = parsearProducto(fd({ precio: "20.00", comparePrice: "15.00" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/mayor al precio/i);
  });

  it("rechaza comparePrice igual al precio (debe ser estrictamente mayor)", () => {
    // The compare price is the "struck-through" price; it must be > the current price.
    const res = parsearProducto(fd({ precio: "15.00", comparePrice: "15.00" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/mayor al precio/i);
  });

  it("comparePrice ausente del FormData (no enviado) queda undefined", () => {
    const res = parsearProducto(fd({ comparePrice: "__OMITIR__" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.comparePrice).toBeUndefined();
  });

  it("comparePrice vacío ('') equivale a ausente y queda undefined", () => {
    const res = parsearProducto(fd({ comparePrice: "" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.comparePrice).toBeUndefined();
  });
});

describe("parsearProducto — validaciones de campos", () => {
  it("rechaza nombre demasiado corto (1 carácter)", () => {
    const res = parsearProducto(fd({ nombre: "A" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/nombre/i);
  });

  it("acepta nombre de exactamente 2 caracteres (mínimo válido)", () => {
    expect(parsearProducto(fd({ nombre: "AB" })).ok).toBe(true);
  });

  it("rechaza descripción demasiado corta (menos de 10 caracteres)", () => {
    const res = parsearProducto(fd({ descripcion: "corta" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/descripción/i);
  });

  it("rechaza precio no numérico ('abc')", () => {
    const res = parsearProducto(fd({ precio: "abc" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/precio/i);
  });

  it("rechaza precio con más de 2 decimales", () => {
    const res = parsearProducto(fd({ precio: "12.555" }));
    expect(res.ok).toBe(false);
  });

  it("rechaza precio cero", () => {
    expect(parsearProducto(fd({ precio: "0" })).ok).toBe(false);
  });

  it("rechaza precio negativo", () => {
    expect(parsearProducto(fd({ precio: "-10.00" })).ok).toBe(false);
  });

  it("rechaza precio superior al máximo (L 999999.99)", () => {
    // 1000000 exceeds the maximum cap of 999999.99
    expect(parsearProducto(fd({ precio: "1000000" })).ok).toBe(false);
  });

  it("acepta precio exactamente en el límite máximo (L 999999.99)", () => {
    expect(parsearProducto(fd({ precio: "999999.99" })).ok).toBe(true);
  });

  it("acepta precio entero sin decimales", () => {
    const res = parsearProducto(fd({ precio: "50" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.precio).toBe("50");
  });

  it("rechaza stock negativo", () => {
    expect(parsearProducto(fd({ stock: "-1" })).ok).toBe(false);
  });

  it("rechaza stock con decimal (no entero)", () => {
    expect(parsearProducto(fd({ stock: "2.5" })).ok).toBe(false);
  });

  it("acepta stock cero (producto sin existencias es válido al crear)", () => {
    const res = parsearProducto(fd({ stock: "0" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.stock).toBe(0);
  });

  it("rechaza SKU demasiado corto (menos de 3 caracteres)", () => {
    const res = parsearProducto(fd({ sku: "AB" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/SKU/i);
  });

  it("acepta SKU de exactamente 3 caracteres (mínimo válido)", () => {
    expect(parsearProducto(fd({ sku: "ABC" })).ok).toBe(true);
  });

  it("rechaza imagen que no sea ruta local (URL externa)", () => {
    const res = parsearProducto(fd({ imagenUrl: "https://externo.com/x.png" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/ruta local/i);
  });

  it("acepta imagenUrl vacía ('') como ausente (queda undefined)", () => {
    const res = parsearProducto(fd({ imagenUrl: "" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.imagenUrl).toBeUndefined();
  });

  it("rechaza slug con caracteres inválidos (espacios, mayúsculas)", () => {
    // The schema normalizes to lowercase but the spaces make it invalid in RE_SLUG
    const res = parsearProducto(fd({ slug: "Slug Con Espacios" }));
    expect(res.ok).toBe(false);
  });

  it("slug vacío '' deriva del nombre automáticamente", () => {
    const res = parsearProducto(fd({ slug: "" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.slug).toBe("lapiz-hb-premium");
  });

  it("rechaza categoría faltante (no enviada)", () => {
    const res = parsearProducto(fd({ categoryId: "__OMITIR__" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/categoría/i);
  });

  it("rechaza categoryId vacío ('')", () => {
    const res = parsearProducto(fd({ categoryId: "" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/categoría/i);
  });

  it("el mensaje de error es texto en español (literal: 'debe')", () => {
    const res = parsearProducto(fd({ precio: "0" }));
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toMatch(/debe/i);
  });

  it("trim aplicado al nombre: espacios al inicio/final son eliminados", () => {
    const res = parsearProducto(fd({ nombre: "  Cuaderno rayado  " }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.nombre).toBe("Cuaderno rayado");
  });

  it("trim aplicado al SKU: espacios son eliminados", () => {
    const res = parsearProducto(fd({ sku: "  SKU-001  " }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.sku).toBe("SKU-001");
  });

  it("marca vacía ('') queda undefined (campo opcional)", () => {
    const res = parsearProducto(fd({ marca: "" }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data.marca).toBeUndefined();
  });

  it("checkboxes no enviados (ausentes) producen false (no true)", () => {
    const res = parsearProducto(fd({ activo: "__OMITIR__", destacado: "__OMITIR__" }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.activo).toBe(false);
      expect(res.data.destacado).toBe(false);
    }
  });

  it("checkbox con valor distinto de '1' (p.ej. 'on') produce false", () => {
    const res = parsearProducto(fd({ activo: "on", destacado: "true" }));
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.activo).toBe(false);
      expect(res.data.destacado).toBe(false);
    }
  });
});
