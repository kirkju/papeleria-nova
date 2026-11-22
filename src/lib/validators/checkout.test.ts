/**
 * Tests for the validator of the checkout's FormData contract
 * (src/lib/validators/checkout.ts).
 *
 * Uses a real FormData (new FormData() + .set()) to reproduce exactly
 * what the browser sends. Covers happy and error paths in both address
 * modes, messages in Spanish and the behavior of itemsJson.
 *
 * DOCUMENTED NOTE — empty array in itemsJson:
 *   parsearCheckout accepts itemsJson = "[]" and returns { ok: true, data.items: [] }
 *   because itemsCarritoSchema allows empty arrays (it is a valid state of the
 *   cart). It is the crearPedido server action layer that rejects it with
 *   "Tu carrito está vacío." The test documents it explicitly so that it is
 *   not mistaken for a bug in the validator.
 */
import { describe, it, expect } from "vitest";
import {
  parsearCheckout,
  DEPARTAMENTOS_HONDURAS,
} from "./checkout";

// ──────────────────────────────────────────────────────────────────────────────
// Helper: builds a FormData with the minimum fields of "nueva" mode
// ──────────────────────────────────────────────────────────────────────────────

function formNueva(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("direccionModo", "nueva");
  fd.set("nombre", "Ana García");
  fd.set("linea1", "Colonia Kennedy, Bloque 4, Casa 12");
  fd.set("ciudad", "Tegucigalpa");
  fd.set("departamento", "Francisco Morazán");
  fd.set("telefono", "99887766");
  fd.set("metodoPago", "contra_entrega");
  fd.set("itemsJson", JSON.stringify([{ productId: "prod-001", cantidad: 2 }]));
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

/** Happy path, "guardada" mode. */
function formGuardada(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("direccionModo", "guardada");
  fd.set("nombre", "Pedro Flores");
  fd.set("direccionId", "clv_dir_abc123def456");
  fd.set("metodoPago", "tarjeta_demo");
  fd.set("itemsJson", JSON.stringify([{ productId: "prod-002", cantidad: 1 }]));
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

// ──────────────────────────────────────────────────────────────────────────────
// Happy path — "nueva" mode
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — camino feliz modo 'nueva'", () => {
  it("acepta un formulario válido completo y devuelve ok:true", () => {
    const resultado = parsearCheckout(formNueva());
    expect(resultado.ok).toBe(true);
  });

  it("los datos de dirección modo nueva se normalizan correctamente", () => {
    const resultado = parsearCheckout(formNueva());
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.direccion.direccionModo).toBe("nueva");
    expect(resultado.data.direccion.nombre).toBe("Ana García");
  });

  it("los items se deserializan y devuelven como array con el productId correcto", () => {
    const resultado = parsearCheckout(formNueva());
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.items).toHaveLength(1);
    expect(resultado.data.items[0].productId).toBe("prod-001");
    expect(resultado.data.items[0].cantidad).toBe(2);
  });

  it("el metodoPago contra_entrega queda en la salida", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "contra_entrega" }));
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.metodoPago).toBe("contra_entrega");
  });

  it("el metodoPago tarjeta_demo queda en la salida", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "tarjeta_demo" }));
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.metodoPago).toBe("tarjeta_demo");
  });

  it("linea2 opcional ausente se normaliza a undefined en la salida", () => {
    // formNueva() does not include linea2 → it must end up undefined
    const resultado = parsearCheckout(formNueva());
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.linea2).toBeUndefined();
  });

  it("linea2 opcional presente queda en la salida", () => {
    const resultado = parsearCheckout(formNueva({ linea2: "Apto 3B" }));
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.linea2).toBe("Apto 3B");
  });

  it("linea2 con solo espacios se normaliza a undefined", () => {
    const resultado = parsearCheckout(formNueva({ linea2: "   " }));
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.linea2).toBeUndefined();
  });

  it("guardarDireccion '1' presente se incluye en la salida", () => {
    const fd = formNueva({ guardarDireccion: "1" });
    const resultado = parsearCheckout(fd);
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.guardarDireccion).toBe("1");
  });

  it("guardarDireccion ausente queda undefined (checkbox no marcado)", () => {
    const resultado = parsearCheckout(formNueva());
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.guardarDireccion).toBeUndefined();
  });

  it("trim aplicado al nombre (espacios al inicio y al final)", () => {
    const resultado = parsearCheckout(formNueva({ nombre: "  Ana García  " }));
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.direccion.nombre).toBe("Ana García");
  });

  it("trim aplicado a linea1", () => {
    const resultado = parsearCheckout(formNueva({ linea1: "  Calle 5  " }));
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.linea1).toBe("Calle 5");
  });

  it("trim aplicado a ciudad", () => {
    const resultado = parsearCheckout(formNueva({ ciudad: " San Pedro Sula " }));
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "nueva") throw new Error("modo incorrecto");
    expect(dir.ciudad).toBe("San Pedro Sula");
  });

  it("acepta todos los 18 departamentos de Honduras sin error", () => {
    for (const dep of DEPARTAMENTOS_HONDURAS) {
      const resultado = parsearCheckout(formNueva({ departamento: dep }));
      expect(resultado.ok).toBe(true);
    }
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Happy path — "guardada" mode
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — camino feliz modo 'guardada'", () => {
  it("acepta un formulario válido de dirección guardada y devuelve ok:true", () => {
    const resultado = parsearCheckout(formGuardada());
    expect(resultado.ok).toBe(true);
  });

  it("el modo de dirección queda como 'guardada'", () => {
    const resultado = parsearCheckout(formGuardada());
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.direccion.direccionModo).toBe("guardada");
  });

  it("direccionId se conserva en la salida", () => {
    const resultado = parsearCheckout(formGuardada());
    if (!resultado.ok) throw new Error(resultado.error);
    const dir = resultado.data.direccion;
    if (dir.direccionModo !== "guardada") throw new Error("modo incorrecto");
    expect(dir.direccionId).toBe("clv_dir_abc123def456");
  });

  it("nombre de quien recibe se incluye también en modo guardada", () => {
    const resultado = parsearCheckout(formGuardada({ nombre: "María López" }));
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.direccion.nombre).toBe("María López");
  });

  it("los items se deserializan correctamente en modo guardada", () => {
    const resultado = parsearCheckout(formGuardada());
    if (!resultado.ok) throw new Error(resultado.error);
    expect(resultado.data.items[0].productId).toBe("prod-002");
    expect(resultado.data.items[0].cantidad).toBe(1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — empty or missing nombre (required in both modes)
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — nombre vacío o ausente", () => {
  it("nombre vacío en modo nueva => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ nombre: "" }));
    expect(resultado.ok).toBe(false);
  });

  it("nombre solo espacios en modo nueva => ok:false (queda vacío tras trim)", () => {
    const resultado = parsearCheckout(formNueva({ nombre: "   " }));
    expect(resultado.ok).toBe(false);
  });

  it("nombre vacío en modo guardada => ok:false", () => {
    const resultado = parsearCheckout(formGuardada({ nombre: "" }));
    expect(resultado.ok).toBe(false);
  });

  it("mensaje de error al faltar nombre incluye texto descriptivo en español", () => {
    const resultado = parsearCheckout(formNueva({ nombre: "" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    // The message must mention the recipient's name
    expect(resultado.error.toLowerCase()).toContain("nombre");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — missing required fields of "nueva" mode
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — campos requeridos de modo 'nueva' ausentes", () => {
  it("falta linea1 en modo nueva => ok:false", () => {
    const fd = new FormData();
    fd.set("direccionModo", "nueva");
    fd.set("nombre", "Carlos Mejía");
    // linea1 intentionally missing
    fd.set("ciudad", "La Ceiba");
    fd.set("departamento", "Atlántida");
    fd.set("telefono", "88112233");
    fd.set("metodoPago", "contra_entrega");
    fd.set("itemsJson", JSON.stringify([{ productId: "p1", cantidad: 1 }]));
    const resultado = parsearCheckout(fd);
    expect(resultado.ok).toBe(false);
  });

  it("falta ciudad en modo nueva => ok:false", () => {
    const fd = new FormData();
    fd.set("direccionModo", "nueva");
    fd.set("nombre", "Carlos Mejía");
    fd.set("linea1", "Barrio El Centro");
    // ciudad intentionally missing
    fd.set("departamento", "Atlántida");
    fd.set("telefono", "88112233");
    fd.set("metodoPago", "contra_entrega");
    fd.set("itemsJson", JSON.stringify([{ productId: "p1", cantidad: 1 }]));
    const resultado = parsearCheckout(fd);
    expect(resultado.ok).toBe(false);
  });

  it("falta departamento en modo nueva => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "" }));
    expect(resultado.ok).toBe(false);
  });

  it("falta telefono en modo nueva => ok:false", () => {
    const fd = new FormData();
    fd.set("direccionModo", "nueva");
    fd.set("nombre", "Luis Herrera");
    fd.set("linea1", "Colonia Palmira");
    fd.set("ciudad", "Tegucigalpa");
    fd.set("departamento", "Francisco Morazán");
    // telefono intentionally missing
    fd.set("metodoPago", "tarjeta_demo");
    fd.set("itemsJson", JSON.stringify([{ productId: "p1", cantidad: 1 }]));
    const resultado = parsearCheckout(fd);
    expect(resultado.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — missing direccionId in "guardada" mode
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — direccionId ausente en modo 'guardada'", () => {
  it("direccionId vacío en modo guardada => ok:false", () => {
    const resultado = parsearCheckout(formGuardada({ direccionId: "" }));
    expect(resultado.ok).toBe(false);
  });

  it("direccionId ausente (no enviado) en modo guardada => ok:false", () => {
    const fd = new FormData();
    fd.set("direccionModo", "guardada");
    fd.set("nombre", "Rosa Soto");
    // direccionId is NOT included
    fd.set("metodoPago", "contra_entrega");
    fd.set("itemsJson", JSON.stringify([{ productId: "p1", cantidad: 1 }]));
    const resultado = parsearCheckout(fd);
    expect(resultado.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — invalid departamento
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — departamento inválido", () => {
  it("departamento fuera de los 18 => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "Guadalajara" }));
    expect(resultado.ok).toBe(false);
  });

  it("mensaje de error menciona 'departamento' o 'válido' al recibir uno inválido", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "No Existe" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error.toLowerCase()).toMatch(/departamento|válido/);
  });

  it("departamento en minúsculas no pasa (el enum es exacto con acentos)", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "francisco morazán" }));
    expect(resultado.ok).toBe(false);
  });

  it("cadena vacía como departamento => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "" }));
    expect(resultado.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — invalid metodoPago
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — metodoPago inválido", () => {
  it("metodoPago desconocido => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "bitcoin" }));
    expect(resultado.ok).toBe(false);
  });

  it("metodoPago vacío => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "" }));
    expect(resultado.ok).toBe(false);
  });

  it("mensaje de error al enviar metodoPago inválido menciona 'método de pago'", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "paypal" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error).toBe("Selecciona un método de pago válido.");
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Errors — itemsJson
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — itemsJson malformado o inválido", () => {
  it("itemsJson con JSON malformado => ok:false con mensaje de carrito", () => {
    const resultado = parsearCheckout(formNueva({ itemsJson: "{no-es-json}" }));
    expect(resultado.ok).toBe(false);
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error).toBe("No se pudieron leer los productos del carrito.");
  });

  it("itemsJson con string que no es array JSON => ok:false", () => {
    const resultado = parsearCheckout(formNueva({ itemsJson: '"solo un string"' }));
    expect(resultado.ok).toBe(false);
  });

  it("itemsJson con objeto JSON (no array) => ok:false", () => {
    const resultado = parsearCheckout(
      formNueva({ itemsJson: '{"productId":"p1","cantidad":1}' }),
    );
    expect(resultado.ok).toBe(false);
  });

  it("itemsJson con array vacío '[]' => parsearCheckout lo acepta (el action lo rechaza por separado)", () => {
    // DOCUMENTED: itemsCarritoSchema allows [], so parsearCheckout returns
    // ok:true with items=[]. The crearPedido server action is the one that throws
    // "Tu carrito está vacío." on detecting items.length === 0.
    const resultado = parsearCheckout(formNueva({ itemsJson: "[]" }));
    expect(resultado.ok).toBe(true);
    if (resultado.ok) {
      expect(resultado.data.items).toHaveLength(0);
    }
  });

  it("itemsJson con más de 100 líneas distintas => ok:false (tope del carrito)", () => {
    const items = Array.from({ length: 101 }, (_, i) => ({
      productId: `prod-${String(i).padStart(3, "0")}`,
      cantidad: 1,
    }));
    const resultado = parsearCheckout(formNueva({ itemsJson: JSON.stringify(items) }));
    expect(resultado.ok).toBe(false);
  });

  it("itemsJson con cantidad 0 => ok:false (cantidad mínima es 1)", () => {
    const resultado = parsearCheckout(
      formNueva({
        itemsJson: JSON.stringify([{ productId: "prod-001", cantidad: 0 }]),
      }),
    );
    expect(resultado.ok).toBe(false);
  });

  it("itemsJson faltante (campo no enviado) => ok:false", () => {
    const fd = new FormData();
    fd.set("direccionModo", "nueva");
    fd.set("nombre", "Test Usuario");
    fd.set("linea1", "Calle Test 1");
    fd.set("ciudad", "Tegucigalpa");
    fd.set("departamento", "Francisco Morazán");
    fd.set("telefono", "99990000");
    fd.set("metodoPago", "contra_entrega");
    // itemsJson is NOT sent
    const resultado = parsearCheckout(fd);
    expect(resultado.ok).toBe(false);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// DEPARTAMENTOS_HONDURAS — exported constant
// ──────────────────────────────────────────────────────────────────────────────

describe("DEPARTAMENTOS_HONDURAS — constante exportada", () => {
  it("contiene exactamente 18 departamentos", () => {
    expect(DEPARTAMENTOS_HONDURAS).toHaveLength(18);
  });

  it("incluye los departamentos más conocidos de Honduras", () => {
    expect(DEPARTAMENTOS_HONDURAS).toContain("Francisco Morazán");
    expect(DEPARTAMENTOS_HONDURAS).toContain("Cortés");
    expect(DEPARTAMENTOS_HONDURAS).toContain("Atlántida");
    expect(DEPARTAMENTOS_HONDURAS).toContain("Comayagua");
    expect(DEPARTAMENTOS_HONDURAS).toContain("Yoro");
  });

  it("todos los elementos son strings no vacíos", () => {
    for (const dep of DEPARTAMENTOS_HONDURAS) {
      expect(typeof dep).toBe("string");
      expect(dep.length).toBeGreaterThan(0);
    }
  });

  it("no hay duplicados en la lista", () => {
    const unicos = new Set(DEPARTAMENTOS_HONDURAS);
    expect(unicos.size).toBe(DEPARTAMENTOS_HONDURAS.length);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Error messages in Spanish — literal check of the key ones
// ──────────────────────────────────────────────────────────────────────────────

describe("parsearCheckout — mensajes de error en español verificados literal", () => {
  it("metodoPago inválido emite exactamente 'Selecciona un método de pago válido.'", () => {
    const resultado = parsearCheckout(formNueva({ metodoPago: "transferencia" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error).toBe("Selecciona un método de pago válido.");
  });

  it("departamento inválido emite exactamente 'Selecciona un departamento válido.'", () => {
    const resultado = parsearCheckout(formNueva({ departamento: "Atlantida" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error).toBe("Selecciona un departamento válido.");
  });

  it("itemsJson no parseable emite exactamente 'No se pudieron leer los productos del carrito.'", () => {
    const resultado = parsearCheckout(formNueva({ itemsJson: "{{mal}}" }));
    if (resultado.ok) throw new Error("Se esperaba error");
    expect(resultado.error).toBe("No se pudieron leer los productos del carrito.");
  });
});
