/**
 * Tests for the validator of the user's ACCOUNT AREA
 * (src/lib/validators/cuenta.ts).
 *
 * Uses a real FormData (new FormData() + .set()) to reproduce exactly what
 * the browser sends. Covers:
 *  - parsearPerfil: valid name with trim, short/long/empty/whitespace-only.
 *  - parsearCambioPassword: happy path, empty actual field, nueva short/long
 *    /without a letter/without a number, different confirmation (literal message),
 *    missing confirmation, missing fields; boundary tests at 8 and 72 (both limits valid).
 *  - parsearPaginaPedidos: defaults, invalid values (abc/0/-1 => 1), valid
 *    value, repeated array (uses the first one), never throws.
 *  - TAMANO_PAGINA_PEDIDOS: exported constant = 10.
 *
 * The messages are checked against the LITERAL TEXT fixed in the backend
 * contract so that the tests detect regressions in the wording.
 */
import { describe, it, expect } from "vitest";
import {
  parsearPerfil,
  parsearCambioPassword,
  parsearPaginaPedidos,
  TAMANO_PAGINA_PEDIDOS,
} from "./cuenta";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Builds a profile FormData with the given overrides.
 * By default it includes a valid name.
 */
function formPerfil(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("nombre", "Ana García");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

/**
 * Builds a password change FormData with the given overrides.
 * By default all the fields are valid.
 */
function formPassword(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("actual", "miActual1");
  fd.set("nueva", "nuevaPass1");
  fd.set("confirmacion", "nuevaPass1");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

// ────────────────────────────────────────────────────────────────────────────
// TAMANO_PAGINA_PEDIDOS
// ────────────────────────────────────────────────────────────────────────────

describe("TAMANO_PAGINA_PEDIDOS", () => {
  it("exporta la constante con valor 10", () => {
    expect(TAMANO_PAGINA_PEDIDOS).toBe(10);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearPerfil — happy path
// ────────────────────────────────────────────────────────────────────────────

describe("parsearPerfil — camino feliz", () => {
  it("acepta un nombre válido y devuelve ok:true con los datos", () => {
    const r = parsearPerfil(formPerfil());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nombre).toBe("Ana García");
  });

  it("aplica trim al nombre: espacios al inicio y al final se eliminan", () => {
    const r = parsearPerfil(formPerfil({ nombre: "  Ana García  " }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nombre).toBe("Ana García");
  });

  it("acepta nombre en el límite mínimo exacto (2 caracteres)", () => {
    const r = parsearPerfil(formPerfil({ nombre: "AB" }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nombre).toBe("AB");
  });

  it("acepta nombre en el límite máximo exacto (80 caracteres)", () => {
    const r = parsearPerfil(formPerfil({ nombre: "A".repeat(80) }));
    expect(r.ok).toBe(true);
  });

  it("acepta nombre con acentos y caracteres especiales del español", () => {
    const r = parsearPerfil(formPerfil({ nombre: "María José Ávila Ñúñez" }));
    expect(r.ok).toBe(true);
  });

  it("trim hace que '  AB  ' (4 chars con espacios) quede como 'AB' de 2 chars (válido)", () => {
    const r = parsearPerfil(formPerfil({ nombre: "  AB  " }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nombre).toBe("AB");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearPerfil — invalid nombre field
// ────────────────────────────────────────────────────────────────────────────

describe("parsearPerfil — nombre inválido", () => {
  it("nombre de 1 carácter es rechazado con mensaje de longitud mínima", () => {
    const r = parsearPerfil(formPerfil({ nombre: "X" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("nombre vacío es rechazado con mensaje de longitud mínima", () => {
    const r = parsearPerfil(formPerfil({ nombre: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("nombre de solo espacios (equivalente a vacío tras trim) es rechazado", () => {
    const r = parsearPerfil(formPerfil({ nombre: "   " }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("campo nombre ausente del FormData devuelve el mensaje de campo requerido", () => {
    // When the field is not in the FormData, leerCampo returns undefined
    const fd = new FormData();
    const r = parsearPerfil(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Escribe tu nombre.");
  });

  it("nombre de 81 caracteres supera el máximo y es rechazado", () => {
    const r = parsearPerfil(formPerfil({ nombre: "B".repeat(81) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El nombre es demasiado largo.");
  });

  it("nombre de 200 caracteres es rechazado por superar el máximo", () => {
    const r = parsearPerfil(formPerfil({ nombre: "N".repeat(200) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/demasiado largo/i);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearPerfil — literal messages in Spanish
// ────────────────────────────────────────────────────────────────────────────

describe("parsearPerfil — mensajes de error literales en español", () => {
  it("error de nombre corto (1 char) dice exactamente 'El nombre debe tener al menos 2 caracteres.'", () => {
    const r = parsearPerfil(formPerfil({ nombre: "A" }));
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("error de nombre largo (81 chars) dice exactamente 'El nombre es demasiado largo.'", () => {
    const r = parsearPerfil(formPerfil({ nombre: "A".repeat(81) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El nombre es demasiado largo.");
  });

  it("campo ausente dice exactamente 'Escribe tu nombre.'", () => {
    const fd = new FormData();
    const r = parsearPerfil(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Escribe tu nombre.");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — happy path
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — camino feliz", () => {
  it("acepta los tres campos válidos y devuelve ok:true", () => {
    const r = parsearCambioPassword(formPassword());
    expect(r.ok).toBe(true);
  });

  it("los tres campos validados se incluyen en la salida", () => {
    const r = parsearCambioPassword(formPassword());
    if (!r.ok) throw new Error("Se esperaba éxito");
    expect(r.data.actual).toBe("miActual1");
    expect(r.data.nueva).toBe("nuevaPass1");
    expect(r.data.confirmacion).toBe("nuevaPass1");
  });

  it("boundary inferior: nueva de exactamente 8 caracteres (con letra y número) es válida", () => {
    // Exact min of the schema: 8. 'Abcde123' has 8 chars, 1+ letter and 1+ number.
    const r = parsearCambioPassword(
      formPassword({ nueva: "Abcde123", confirmacion: "Abcde123" }),
    );
    expect(r.ok).toBe(true);
  });

  it("boundary superior: nueva de exactamente 72 caracteres (límite bcrypt) es válida", () => {
    // Exact max of the schema: 72. 'a'*71 + '1' = 72 chars with a letter and a number.
    const pass72 = "a".repeat(71) + "1";
    const r = parsearCambioPassword(
      formPassword({ nueva: pass72, confirmacion: pass72 }),
    );
    expect(r.ok).toBe(true);
  });

  it("la contraseña actual puede ser cualquier string no vacío sin restricción de fortaleza", () => {
    // The current password only requires min(1); strength is not revalidated here.
    const r = parsearCambioPassword(
      formPassword({ actual: "12345" }),
    );
    expect(r.ok).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — actual field
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — campo actual (contraseña actual)", () => {
  it("actual vacía es rechazada con 'Datos incompletos.'", () => {
    const r = parsearCambioPassword(formPassword({ actual: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Datos incompletos.");
  });

  it("actual ausente del FormData es rechazada con 'Datos incompletos.'", () => {
    const fd = new FormData();
    fd.set("nueva", "nuevaPass1");
    fd.set("confirmacion", "nuevaPass1");
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Datos incompletos.");
  });

  it("actual con solo un caracter (min:1) es aceptada", () => {
    const r = parsearCambioPassword(formPassword({ actual: "x" }));
    expect(r.ok).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — nueva field (new password)
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — campo nueva (contraseña nueva)", () => {
  it("nueva de 7 caracteres es rechazada (boundary inferior: 7 < 8)", () => {
    // 'Short1x' = 7 chars with a letter and a number, but it fails min(8)
    const r = parsearCambioPassword(
      formPassword({ nueva: "Short1x", confirmacion: "Short1x" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("nueva de 73 caracteres es rechazada (boundary superior: 73 > 72)", () => {
    // 'a'*72 + '1' = 73 chars; exceeds bcrypt's effective limit
    const pass73 = "a".repeat(72) + "1";
    const r = parsearCambioPassword(
      formPassword({ nueva: pass73, confirmacion: pass73 }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("La contraseña es demasiado larga.");
  });

  it("nueva sin letra alguna es rechazada", () => {
    // '12345678' = 8 chars, numbers only
    const r = parsearCambioPassword(
      formPassword({ nueva: "12345678", confirmacion: "12345678" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe(
        "La contraseña debe incluir al menos una letra y un número.",
      );
  });

  it("nueva sin número alguno es rechazada", () => {
    // 'Abcdefgh' = 8 chars, letters only
    const r = parsearCambioPassword(
      formPassword({ nueva: "Abcdefgh", confirmacion: "Abcdefgh" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe(
        "La contraseña debe incluir al menos una letra y un número.",
      );
  });

  it("nueva ausente del FormData es rechazada", () => {
    const fd = new FormData();
    fd.set("actual", "miActual1");
    fd.set("confirmacion", "nuevaPass1");
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
  });

  it("nueva vacía es rechazada", () => {
    const r = parsearCambioPassword(
      formPassword({ nueva: "", confirmacion: "" }),
    );
    expect(r.ok).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — confirmacion field
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — campo confirmacion (confirmar contraseña)", () => {
  it("confirmación distinta a la nueva devuelve exactamente 'Las contraseñas no coinciden.'", () => {
    const r = parsearCambioPassword(
      formPassword({ nueva: "nuevaPass1", confirmacion: "diferente1" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Las contraseñas no coinciden.");
  });

  it("confirmación ausente del FormData devuelve 'Confirma tu nueva contraseña.'", () => {
    const fd = new FormData();
    fd.set("actual", "miActual1");
    fd.set("nueva", "nuevaPass1");
    // 'confirmacion' is NOT included -> leerCampo returns undefined
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Confirma tu nueva contraseña.");
  });

  it("confirmación vacía devuelve 'Confirma tu nueva contraseña.'", () => {
    const r = parsearCambioPassword(formPassword({ confirmacion: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Confirma tu nueva contraseña.");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — fields missing at the same time
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — campos ausentes", () => {
  it("FormData completamente vacío es rechazado (falta actual, nueva, confirmacion)", () => {
    const fd = new FormData();
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
    // The first error corresponds to the 'actual' field (Datos incompletos.)
    if (!r.ok) expect(r.error).toBe("Datos incompletos.");
  });

  it("con solo el campo actual presente, rechaza por falta de nueva", () => {
    const fd = new FormData();
    fd.set("actual", "miActual1");
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
  });

  it("nunca lanza; siempre devuelve { ok: false, error } ante datos inválidos", () => {
    expect(() => parsearCambioPassword(new FormData())).not.toThrow();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearCambioPassword — literal messages in Spanish
// ────────────────────────────────────────────────────────────────────────────

describe("parsearCambioPassword — mensajes de error literales en español", () => {
  it("actual vacía dice exactamente 'Datos incompletos.'", () => {
    const r = parsearCambioPassword(formPassword({ actual: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Datos incompletos.");
  });

  it("nueva de 7 chars dice exactamente 'La contraseña debe tener al menos 8 caracteres.'", () => {
    const r = parsearCambioPassword(
      formPassword({ nueva: "Short1x", confirmacion: "Short1x" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("La contraseña debe tener al menos 8 caracteres.");
  });

  it("nueva de 73 chars dice exactamente 'La contraseña es demasiado larga.'", () => {
    const pass73 = "a".repeat(72) + "1";
    const r = parsearCambioPassword(
      formPassword({ nueva: pass73, confirmacion: pass73 }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("La contraseña es demasiado larga.");
  });

  it("nueva solo letras dice exactamente 'La contraseña debe incluir al menos una letra y un número.'", () => {
    const r = parsearCambioPassword(
      formPassword({ nueva: "Abcdefgh", confirmacion: "Abcdefgh" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe(
        "La contraseña debe incluir al menos una letra y un número.",
      );
  });

  it("confirmación distinta dice exactamente 'Las contraseñas no coinciden.'", () => {
    const r = parsearCambioPassword(
      formPassword({ confirmacion: "diferente1" }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Las contraseñas no coinciden.");
  });

  it("confirmación ausente dice exactamente 'Confirma tu nueva contraseña.'", () => {
    const fd = new FormData();
    fd.set("actual", "miActual1");
    fd.set("nueva", "nuevaPass1");
    const r = parsearCambioPassword(fd);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Confirma tu nueva contraseña.");
  });
});

// ────────────────────────────────────────────────────────────────────────────
// parsearPaginaPedidos — total behavior (never throws)
// ────────────────────────────────────────────────────────────────────────────

describe("parsearPaginaPedidos — defaults y comportamiento total", () => {
  it("searchParams vacío devuelve { page: 1 } por defecto", () => {
    expect(parsearPaginaPedidos({})).toEqual({ page: 1 });
  });

  it("page ausente del objeto devuelve { page: 1 }", () => {
    expect(parsearPaginaPedidos({})).toEqual({ page: 1 });
  });

  it("page='abc' (no numérico) cae al default 1", () => {
    expect(parsearPaginaPedidos({ page: "abc" })).toEqual({ page: 1 });
  });

  it("page='0' cae al default 1 (mínimo es 1)", () => {
    expect(parsearPaginaPedidos({ page: "0" })).toEqual({ page: 1 });
  });

  it("page='-1' cae al default 1 (negativos no permitidos)", () => {
    expect(parsearPaginaPedidos({ page: "-1" })).toEqual({ page: 1 });
  });

  it("page='-100' cae al default 1", () => {
    expect(parsearPaginaPedidos({ page: "-100" })).toEqual({ page: 1 });
  });

  it("page='1' (boundary inferior válido) devuelve { page: 1 }", () => {
    expect(parsearPaginaPedidos({ page: "1" })).toEqual({ page: 1 });
  });

  it("page='2' devuelve { page: 2 }", () => {
    expect(parsearPaginaPedidos({ page: "2" })).toEqual({ page: 2 });
  });

  it("page='5' devuelve { page: 5 }", () => {
    expect(parsearPaginaPedidos({ page: "5" })).toEqual({ page: 5 });
  });

  it("page='100' devuelve { page: 100 }", () => {
    expect(parsearPaginaPedidos({ page: "100" })).toEqual({ page: 100 });
  });

  it("page como array repetido ['3','7'] usa el primer valor (3)", () => {
    // Next.js passes arrays when the parameter comes repeated in the URL
    expect(parsearPaginaPedidos({ page: ["3", "7"] })).toEqual({ page: 3 });
  });

  it("page como array ['abc','5'] usa el primer valor inválido y cae al default 1", () => {
    expect(parsearPaginaPedidos({ page: ["abc", "5"] })).toEqual({ page: 1 });
  });

  it("page como array vacío [] cae al default 1", () => {
    // primero([]) returns undefined => there is no page => default 1
    expect(parsearPaginaPedidos({ page: [] })).toEqual({ page: 1 });
  });

  it("nunca lanza con valores completamente inválidos", () => {
    expect(() => parsearPaginaPedidos({ page: "basura-total" })).not.toThrow();
    expect(() => parsearPaginaPedidos({ page: ["x", "y"] })).not.toThrow();
    expect(() => parsearPaginaPedidos({ page: undefined })).not.toThrow();
  });

  it("page='1.5' (decimal) cae al default 1 (solo enteros)", () => {
    // z.coerce.number().int() rejects decimals
    expect(parsearPaginaPedidos({ page: "1.5" })).toEqual({ page: 1 });
  });
});
