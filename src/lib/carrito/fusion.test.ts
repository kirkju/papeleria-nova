/**
 * Tests for the pure cart merging and normalization logic.
 *
 * fusionarItems — use case: login (ADDS UP local + remote).
 * normalizarItems — use case: active synchronization (idempotent replace-all).
 *
 * No Prisma or Next here; we build the product Map by hand.
 */
import { describe, it, expect } from "vitest";
import {
  fusionarItems,
  normalizarItems,
  type ItemCarritoPlano,
  type InfoProductoCarrito,
} from "./fusion";

// ---------------------------------------------------------------------------
// Helpers to build test data
// ---------------------------------------------------------------------------

function mkProducto(
  override: Partial<InfoProductoCarrito> & { id: string },
): InfoProductoCarrito {
  return {
    nombre: "Producto de prueba",
    precio: 50,
    sku: `SKU-${override.id}`,
    stock: 10,
    activo: true,
    imagen: null,
    ...override,
  };
}

function mkMapa(
  productos: InfoProductoCarrito[],
): Map<string, InfoProductoCarrito> {
  return new Map(productos.map((p) => [p.id, p]));
}

// ---------------------------------------------------------------------------
// Reusable test products
// ---------------------------------------------------------------------------

const LAPIZ = mkProducto({ id: "p-lapiz", nombre: "Lápiz HB", precio: 15, stock: 10 });
const CUADERNO = mkProducto({ id: "p-cuaderno", nombre: "Cuaderno Norma 100h", precio: 85, stock: 5 });
const REGLA = mkProducto({ id: "p-regla", nombre: "Regla 30cm", precio: 20, stock: 3 });
const BORRADOR_INACTIVO = mkProducto({ id: "p-borrador", nombre: "Borrador Pelikan", activo: false });
const GOMA_AGOTADA = mkProducto({ id: "p-goma", nombre: "Goma de pegar", stock: 0 });

// ---------------------------------------------------------------------------
// fusionarItems
// ---------------------------------------------------------------------------

describe("fusionarItems — caso login: SUMA local + remoto", () => {
  it("suma cantidades del mismo productId de local y remoto", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 3 }];
    const remotos: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 2 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, remotos, mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].productId).toBe("p-lapiz");
    expect(resultado[0].cantidad).toBe(5); // 3 + 2
  });

  it("clampa la suma al stock máximo del producto", () => {
    // LAPIZ stock=10; local=7 + remote=6 = 13 → clamp to 10
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 7 }];
    const remotos: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 6 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, remotos, mapa);

    expect(resultado[0].cantidad).toBe(10);
  });

  it("descarta un producto que no existe en el mapa de productos", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-inexistente", cantidad: 2 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(0);
  });

  it("descarta un producto marcado como inactivo (activo=false)", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-borrador", cantidad: 1 }];
    const mapa = mkMapa([BORRADOR_INACTIVO]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(0);
  });

  it("descarta un producto con stock cero (sin existencias)", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-goma", cantidad: 2 }];
    const mapa = mkMapa([GOMA_AGOTADA]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(0);
  });

  it("orden estable: los remotos aparecen primero, los locales nuevos al final", () => {
    const remotos: ItemCarritoPlano[] = [
      { productId: "p-cuaderno", cantidad: 1 },
      { productId: "p-lapiz", cantidad: 1 },
    ];
    const locales: ItemCarritoPlano[] = [
      { productId: "p-regla", cantidad: 1 }, // new in local
      { productId: "p-lapiz", cantidad: 2 }, // already in remote
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO, REGLA]);

    const resultado = fusionarItems(locales, remotos, mapa);

    // Expected order: cuaderno (remote first), lapiz (remote, added up), regla (new local)
    expect(resultado.map((r) => r.productId)).toEqual([
      "p-cuaderno",
      "p-lapiz",
      "p-regla",
    ]);
  });

  it("solo items locales (remotos vacíos) los agrega correctamente", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 4 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(4);
  });

  it("solo items remotos (locales vacíos) los agrega correctamente", () => {
    const remotos: ItemCarritoPlano[] = [{ productId: "p-cuaderno", cantidad: 2 }];
    const mapa = mkMapa([CUADERNO]);

    const resultado = fusionarItems([], remotos, mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(2);
  });

  it("ambos arrays vacíos devuelven array vacío", () => {
    const mapa = mkMapa([LAPIZ]);
    expect(fusionarItems([], [], mapa)).toEqual([]);
  });

  it("mapa de productos vacío descarta todos los items", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 1 }];
    const remotos: ItemCarritoPlano[] = [{ productId: "p-cuaderno", cantidad: 1 }];
    const mapa = mkMapa([]);

    expect(fusionarItems(locales, remotos, mapa)).toEqual([]);
  });

  it("duplicados dentro de locales: suma sus cantidades y clampa al stock", () => {
    // Two entries with the same productId in the same local array
    const locales: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 4 },
      { productId: "p-lapiz", cantidad: 5 },
    ];
    const mapa = mkMapa([LAPIZ]); // stock=10

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(9); // 4+5=9, stock=10 => no clamp needed
  });

  it("duplicados dentro de remotos: suma sus cantidades", () => {
    const remotos: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 6 },
      { productId: "p-lapiz", cantidad: 7 },
    ];
    const mapa = mkMapa([LAPIZ]); // stock=10

    const resultado = fusionarItems([], remotos, mapa);

    // 6+7=13, clamp to stock=10
    expect(resultado[0].cantidad).toBe(10);
  });

  it("cantidad final mínima es 1 aunque la suma sea positiva y baja", () => {
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 1 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado[0].cantidad).toBeGreaterThanOrEqual(1);
  });

  it("fusiona correctamente múltiples productos con mix de casos válidos e inválidos", () => {
    const locales: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 3 },
      { productId: "p-borrador", cantidad: 1 }, // inactive → dropped
      { productId: "p-regla", cantidad: 2 },
    ];
    const remotos: ItemCarritoPlano[] = [
      { productId: "p-cuaderno", cantidad: 1 },
      { productId: "p-goma", cantidad: 5 }, // stock=0 → dropped
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO, REGLA, BORRADOR_INACTIVO, GOMA_AGOTADA]);

    const resultado = fusionarItems(locales, remotos, mapa);

    // Only lapiz, cuaderno and regla are valid
    expect(resultado.map((r) => r.productId)).toContain("p-lapiz");
    expect(resultado.map((r) => r.productId)).toContain("p-cuaderno");
    expect(resultado.map((r) => r.productId)).toContain("p-regla");
    expect(resultado).toHaveLength(3);
  });

  it("cantidad sumada <= 0 (solo aportes inválidos) no genera item en resultado", () => {
    // quantity 0 in both arrays: the total would be 0 => it is dropped
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 0 }];
    const remotos: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 0 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, remotos, mapa);

    expect(resultado).toHaveLength(0);
  });

  it("cantidades no finitas (NaN, Infinity) se tratan como 0 y se descartan", () => {
    const locales: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: NaN },
    ];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, [], mapa);

    expect(resultado).toHaveLength(0);
  });

  it("el precio del resultado viene del mapa del producto, no del payload de entrada", () => {
    // fusionarItems only returns productId + cantidad, not the price
    const locales: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 2 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = fusionarItems(locales, [], mapa);

    // ItemCarritoPlano only has productId and cantidad
    expect(Object.keys(resultado[0])).toEqual(
      expect.arrayContaining(["productId", "cantidad"]),
    );
    expect((resultado[0] as Record<string, unknown>).precio).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// normalizarItems
// ---------------------------------------------------------------------------

describe("normalizarItems — replace-all idempotente: NO suma, solo clampa y descarta", () => {
  it("pasa una lista válida sin cambios cuando todo está dentro del stock", () => {
    const items: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 3 },
      { productId: "p-cuaderno", cantidad: 2 },
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO]);

    const resultado = normalizarItems(items, mapa);

    expect(resultado).toHaveLength(2);
    expect(resultado[0]).toEqual({ productId: "p-lapiz", cantidad: 3 });
    expect(resultado[1]).toEqual({ productId: "p-cuaderno", cantidad: 2 });
  });

  it("clampa cantidad que supera el stock hacia el máximo", () => {
    // CUADERNO stock=5; we send 8
    const items: ItemCarritoPlano[] = [{ productId: "p-cuaderno", cantidad: 8 }];
    const mapa = mkMapa([CUADERNO]);

    const resultado = normalizarItems(items, mapa);

    expect(resultado[0].cantidad).toBe(5);
  });

  it("descarta item con productId inexistente en el mapa", () => {
    const items: ItemCarritoPlano[] = [{ productId: "inexistente", cantidad: 1 }];
    const mapa = mkMapa([LAPIZ]);

    expect(normalizarItems(items, mapa)).toHaveLength(0);
  });

  it("descarta item cuyo producto es inactivo", () => {
    const items: ItemCarritoPlano[] = [{ productId: "p-borrador", cantidad: 2 }];
    const mapa = mkMapa([BORRADOR_INACTIVO]);

    expect(normalizarItems(items, mapa)).toHaveLength(0);
  });

  it("descarta item cuyo producto tiene stock cero", () => {
    const items: ItemCarritoPlano[] = [{ productId: "p-goma", cantidad: 1 }];
    const mapa = mkMapa([GOMA_AGOTADA]);

    expect(normalizarItems(items, mapa)).toHaveLength(0);
  });

  it("descarta item con cantidad cero o negativa", () => {
    const items: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 0 },
      { productId: "p-cuaderno", cantidad: -2 },
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO]);

    expect(normalizarItems(items, mapa)).toHaveLength(0);
  });

  it("preserva el orden de entrada del array", () => {
    const items: ItemCarritoPlano[] = [
      { productId: "p-regla", cantidad: 1 },
      { productId: "p-lapiz", cantidad: 2 },
      { productId: "p-cuaderno", cantidad: 3 },
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO, REGLA]);

    const resultado = normalizarItems(items, mapa);

    expect(resultado.map((r) => r.productId)).toEqual([
      "p-regla",
      "p-lapiz",
      "p-cuaderno",
    ]);
  });

  it("con duplicados en el array de entrada, se queda con el PRIMERO (no suma)", () => {
    // normalizarItems does NOT add up: if the validator did not dedupe, the second one is dropped
    const items: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 3 },
      { productId: "p-lapiz", cantidad: 5 }, // duplicate, ignored
    ];
    const mapa = mkMapa([LAPIZ]);

    const resultado = normalizarItems(items, mapa);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(3); // keeps the first one
  });

  it("array vacío devuelve array vacío", () => {
    const mapa = mkMapa([LAPIZ]);
    expect(normalizarItems([], mapa)).toEqual([]);
  });

  it("es idempotente: aplicarlo dos veces sobre el mismo payload da el mismo resultado", () => {
    const items: ItemCarritoPlano[] = [
      { productId: "p-lapiz", cantidad: 3 },
      { productId: "p-cuaderno", cantidad: 2 },
    ];
    const mapa = mkMapa([LAPIZ, CUADERNO]);

    const primera = normalizarItems(items, mapa);
    const segunda = normalizarItems(primera, mapa);

    expect(segunda).toEqual(primera);
  });

  it("idempotencia con clamp: normalizar un item ya clampado da el mismo resultado", () => {
    // REGLA stock=3; if we send 3 (already clamped), repeating it changes nothing
    const items: ItemCarritoPlano[] = [{ productId: "p-regla", cantidad: 3 }];
    const mapa = mkMapa([REGLA]);

    const primera = normalizarItems(items, mapa);
    const segunda = normalizarItems(primera, mapa);

    expect(segunda).toEqual(primera);
    expect(segunda[0].cantidad).toBe(3);
  });

  it("cantidades no finitas (NaN) son tratadas como cero y el item se descarta", () => {
    const items: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: NaN }];
    const mapa = mkMapa([LAPIZ]);

    expect(normalizarItems(items, mapa)).toHaveLength(0);
  });

  it("cantidad fraccionaria se aplica floor antes de clampar", () => {
    // 2.9 → floor → 2; within stock=10 → 2
    const items: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 2.9 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = normalizarItems(items, mapa);

    expect(resultado[0].cantidad).toBe(2);
  });

  it("no mezcla datos del mapa con el item de salida: solo devuelve productId y cantidad", () => {
    const items: ItemCarritoPlano[] = [{ productId: "p-lapiz", cantidad: 1 }];
    const mapa = mkMapa([LAPIZ]);

    const resultado = normalizarItems(items, mapa);

    expect(Object.keys(resultado[0]).sort()).toEqual(["cantidad", "productId"]);
  });
});
