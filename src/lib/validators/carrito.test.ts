/**
 * Tests for the Zod validator of the cart payload (src/lib/validators/carrito.ts).
 *
 * Verifies that itemsCarritoSchema:
 *  - Accepts valid payloads and returns them unmodified (except for the dedupe).
 *  - Rejects out-of-range fields (cantidad, productId).
 *  - Dedupes productId by adding up quantities and re-clamping to MAX_CANTIDAD_LINEA.
 *  - Rejects arrays with more than MAX_LINEAS_CARRITO lines.
 *  - Handles completely invalid inputs (non-array) without throwing (safeParse).
 */
import { describe, it, expect } from "vitest";
import {
  itemsCarritoSchema,
  MAX_LINEAS_CARRITO,
  MAX_CANTIDAD_LINEA,
} from "./carrito";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Successful parse: returns the value or throws the Zod error so the test fails with a good message. */
function parsear(input: unknown) {
  const res = itemsCarritoSchema.safeParse(input);
  if (!res.success) {
    throw new Error(`Validación falló (se esperaba éxito): ${res.error.message}`);
  }
  return res.data;
}

/** Parse that must fail: returns the ZodError. */
function parsearConFallo(input: unknown) {
  const res = itemsCarritoSchema.safeParse(input);
  if (res.success) {
    throw new Error(`Se esperaba fallo de validación pero pasó: ${JSON.stringify(res.data)}`);
  }
  return res.error;
}

// ---------------------------------------------------------------------------
// Valid payload
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — payload válido", () => {
  it("acepta un array con un solo item válido", () => {
    const resultado = parsear([{ productId: "p-001", cantidad: 3 }]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]).toEqual({ productId: "p-001", cantidad: 3 });
  });

  it("acepta un array con múltiples items distintos", () => {
    const resultado = parsear([
      { productId: "p-001", cantidad: 1 },
      { productId: "p-002", cantidad: 5 },
    ]);
    expect(resultado).toHaveLength(2);
  });

  it("acepta cantidad igual a 1 (mínimo válido)", () => {
    const resultado = parsear([{ productId: "p-001", cantidad: 1 }]);
    expect(resultado[0].cantidad).toBe(1);
  });

  it("acepta cantidad igual a MAX_CANTIDAD_LINEA (999)", () => {
    const resultado = parsear([{ productId: "p-001", cantidad: MAX_CANTIDAD_LINEA }]);
    expect(resultado[0].cantidad).toBe(999);
  });

  it("acepta productId de 1 caracter (mínimo válido)", () => {
    const resultado = parsear([{ productId: "x", cantidad: 1 }]);
    expect(resultado[0].productId).toBe("x");
  });

  it("acepta productId de 64 caracteres (máximo válido)", () => {
    const id64 = "a".repeat(64);
    const resultado = parsear([{ productId: id64, cantidad: 1 }]);
    expect(resultado[0].productId).toBe(id64);
  });

  it("acepta array vacío (carrito vacío es un estado válido)", () => {
    const resultado = parsear([]);
    expect(resultado).toEqual([]);
  });

  it("acepta exactamente MAX_LINEAS_CARRITO items distintos", () => {
    const items = Array.from({ length: MAX_LINEAS_CARRITO }, (_, i) => ({
      productId: `prod-${String(i).padStart(3, "0")}`,
      cantidad: 1,
    }));
    const resultado = parsear(items);
    expect(resultado).toHaveLength(MAX_LINEAS_CARRITO);
  });

  it("recorta espacios del productId con trim", () => {
    const resultado = parsear([{ productId: "  p-001  ", cantidad: 1 }]);
    expect(resultado[0].productId).toBe("p-001");
  });
});

// ---------------------------------------------------------------------------
// Rejections for an invalid quantity
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — cantidad inválida (debe rechazar)", () => {
  it("rechaza cantidad 0", () => {
    parsearConFallo([{ productId: "p-001", cantidad: 0 }]);
  });

  it("rechaza cantidad negativa (-1)", () => {
    parsearConFallo([{ productId: "p-001", cantidad: -1 }]);
  });

  it("rechaza cantidad decimal (1.5 no es entero)", () => {
    parsearConFallo([{ productId: "p-001", cantidad: 1.5 }]);
  });

  it("rechaza cantidad mayor que MAX_CANTIDAD_LINEA (1000)", () => {
    parsearConFallo([{ productId: "p-001", cantidad: MAX_CANTIDAD_LINEA + 1 }]);
  });

  it("rechaza cantidad NaN", () => {
    parsearConFallo([{ productId: "p-001", cantidad: NaN }]);
  });

  it("rechaza cantidad como string numérico ('3')", () => {
    parsearConFallo([{ productId: "p-001", cantidad: "3" }]);
  });

  it("rechaza cantidad null", () => {
    parsearConFallo([{ productId: "p-001", cantidad: null }]);
  });

  it("rechaza item sin el campo cantidad", () => {
    parsearConFallo([{ productId: "p-001" }]);
  });
});

// ---------------------------------------------------------------------------
// Rejections for an invalid productId
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — productId inválido (debe rechazar)", () => {
  it("rechaza productId vacío (string vacío)", () => {
    parsearConFallo([{ productId: "", cantidad: 1 }]);
  });

  it("rechaza productId que tras trim queda vacío (solo espacios)", () => {
    parsearConFallo([{ productId: "   ", cantidad: 1 }]);
  });

  it("rechaza productId de 65 caracteres (supera el máximo)", () => {
    const id65 = "a".repeat(65);
    parsearConFallo([{ productId: id65, cantidad: 1 }]);
  });

  it("rechaza productId null", () => {
    parsearConFallo([{ productId: null, cantidad: 1 }]);
  });

  it("rechaza item sin el campo productId", () => {
    parsearConFallo([{ cantidad: 2 }]);
  });
});

// ---------------------------------------------------------------------------
// Rejection for the array size
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — tamaño del array", () => {
  it("rechaza más de MAX_LINEAS_CARRITO items (101)", () => {
    const items = Array.from({ length: MAX_LINEAS_CARRITO + 1 }, (_, i) => ({
      productId: `prod-${String(i).padStart(3, "0")}`,
      cantidad: 1,
    }));
    parsearConFallo(items);
  });

  it("no rechaza exactamente MAX_LINEAS_CARRITO items (100)", () => {
    const items = Array.from({ length: MAX_LINEAS_CARRITO }, (_, i) => ({
      productId: `prod-${String(i).padStart(3, "0")}`,
      cantidad: 1,
    }));
    expect(() => parsear(items)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// productId deduplication (schema transform)
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — deduplicación de productId", () => {
  it("deduplica un productId duplicado SUMANDO sus cantidades", () => {
    const resultado = parsear([
      { productId: "p-001", cantidad: 3 },
      { productId: "p-001", cantidad: 4 },
    ]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(7);
  });

  it("preserva el orden de primera aparición al deduplicar", () => {
    const resultado = parsear([
      { productId: "p-001", cantidad: 1 },
      { productId: "p-002", cantidad: 1 },
      { productId: "p-001", cantidad: 2 }, // duplicate of p-001
    ]);
    expect(resultado).toHaveLength(2);
    expect(resultado[0].productId).toBe("p-001"); // first to appear
    expect(resultado[1].productId).toBe("p-002");
  });

  it("suma de duplicados clampada a MAX_CANTIDAD_LINEA cuando supera el límite", () => {
    // 800 + 500 = 1300 > 999 → clamp to 999
    const resultado = parsear([
      { productId: "p-001", cantidad: 800 },
      { productId: "p-001", cantidad: 500 },
    ]);
    expect(resultado[0].cantidad).toBe(MAX_CANTIDAD_LINEA);
  });

  it("tres entradas del mismo productId se acumulan correctamente", () => {
    const resultado = parsear([
      { productId: "p-001", cantidad: 2 },
      { productId: "p-001", cantidad: 3 },
      { productId: "p-001", cantidad: 4 },
    ]);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].cantidad).toBe(9);
  });

  it("deduplica solo las entradas repetidas, deja las únicas intactas", () => {
    const resultado = parsear([
      { productId: "p-001", cantidad: 5 },
      { productId: "p-002", cantidad: 2 },
      { productId: "p-003", cantidad: 1 },
      { productId: "p-002", cantidad: 3 }, // duplicate
    ]);
    expect(resultado).toHaveLength(3);
    const p002 = resultado.find((r) => r.productId === "p-002");
    expect(p002?.cantidad).toBe(5); // 2 + 3
  });

  it("suma de cantidades que ya están en límite máximo individual no supera el tope", () => {
    // Each entry is valid on its own (999); combined they would exceed it without the clamp
    const resultado = parsear([
      { productId: "p-001", cantidad: 999 },
      { productId: "p-001", cantidad: 999 },
    ]);
    expect(resultado[0].cantidad).toBeLessThanOrEqual(MAX_CANTIDAD_LINEA);
  });
});

// ---------------------------------------------------------------------------
// Non-array inputs (they must not throw with safeParse)
// ---------------------------------------------------------------------------

describe("itemsCarritoSchema — entradas completamente inválidas no lanzan con safeParse", () => {
  it("null no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse(null);
    expect(res.success).toBe(false);
  });

  it("undefined no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse(undefined);
    expect(res.success).toBe(false);
  });

  it("string no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse("hola");
    expect(res.success).toBe(false);
  });

  it("objeto plano no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse({ productId: "p-001", cantidad: 1 });
    expect(res.success).toBe(false);
  });

  it("número no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse(42);
    expect(res.success).toBe(false);
  });

  it("array con objetos completamente inválidos no lanza, falla con safeParse", () => {
    const res = itemsCarritoSchema.safeParse(["basura", 123, null]);
    expect(res.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Exported constants
// ---------------------------------------------------------------------------

describe("constantes exportadas del validador de carrito", () => {
  it("MAX_LINEAS_CARRITO es 100", () => {
    expect(MAX_LINEAS_CARRITO).toBe(100);
  });

  it("MAX_CANTIDAD_LINEA es 999", () => {
    expect(MAX_CANTIDAD_LINEA).toBe(999);
  });
});
