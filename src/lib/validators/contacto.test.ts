/**
 * Tests for the validator of the PUBLIC contact form
 * (src/lib/validators/contacto.ts).
 *
 * Uses a real FormData (new FormData() + .set()) to reproduce what the
 * browser sends. Covers the happy path, normalization (trim, optional asunto),
 * errors in Spanish and the honeypot's behavior at schema level.
 *
 * HONEYPOT CONTRACT (apellido2):
 *   - The Zod schema rejects the field when it carries content (max(0)).
 *   - parsearContacto returns { ok: false } if the honeypot arrives filled in.
 *   - The SILENT handling ({ ok: true } without persisting) lives in the
 *     enviarMensajeContacto server action, not here. The UI renders the field
 *     off-screen (aria-hidden, tabIndex -1) so that a human never fills it
 *     in; if it arrives with content, it is a bot.
 */
import { describe, it, expect } from "vitest";
import { parsearContacto, CAMPO_HONEYPOT } from "./contacto";

/** Builds a valid FormData with the minimum required fields. */
function formContacto(overrides: Record<string, string> = {}): FormData {
  const fd = new FormData();
  fd.set("nombre", "Ana García");
  fd.set("email", "ana@example.com");
  fd.set("mensaje", "Hola, quisiera saber si tienen cuadernos cosidos en stock.");
  for (const [k, v] of Object.entries(overrides)) {
    fd.set(k, v);
  }
  return fd;
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe("parsearContacto — camino feliz", () => {
  it("acepta los campos mínimos sin asunto y normaliza con trim", () => {
    const r = parsearContacto(formContacto({ nombre: "  Ana García  " }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.nombre).toBe("Ana García");
      expect(r.data.email).toBe("ana@example.com");
      expect(r.data.asunto).toBeUndefined();
      expect(r.data.mensaje).toContain("cuadernos cosidos");
    }
  });

  it("camino feliz completo: con asunto conserva el asunto", () => {
    const r = parsearContacto(
      formContacto({ asunto: "  Consulta de stock  " }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.nombre).toBe("Ana García");
      expect(r.data.email).toBe("ana@example.com");
      expect(r.data.asunto).toBe("Consulta de stock");
      expect(r.data.mensaje).toBeTruthy();
    }
  });

  it("asunto vacío (solo espacios) se normaliza a undefined", () => {
    const r = parsearContacto(formContacto({ asunto: "   " }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.asunto).toBeUndefined();
  });

  it("asunto ausente no enviado queda como undefined", () => {
    // formContacto without asunto → the FormData does not have the key
    const fd = new FormData();
    fd.set("nombre", "Carlos López");
    fd.set("email", "carlos@example.com");
    fd.set("mensaje", "¿Tienen resaltadores fluorescentes en stock?");
    const r = parsearContacto(fd);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.asunto).toBeUndefined();
  });

  it("trim en el nombre: espacios al inicio y final se eliminan", () => {
    const r = parsearContacto(formContacto({ nombre: "   María José   " }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.nombre).toBe("María José");
  });

  it("trim en el mensaje: espacios al inicio y final se eliminan", () => {
    const r = parsearContacto(
      formContacto({ mensaje: "   Necesito cuadernos universitarios.   " }),
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.mensaje).toBe("Necesito cuadernos universitarios.");
  });

  it("nombre en el límite mínimo exacto (2 caracteres) es aceptado", () => {
    const r = parsearContacto(formContacto({ nombre: "Jo" }));
    expect(r.ok).toBe(true);
  });

  it("nombre en el límite máximo exacto (80 caracteres) es aceptado", () => {
    const r = parsearContacto(formContacto({ nombre: "A".repeat(80) }));
    expect(r.ok).toBe(true);
  });

  it("mensaje en el límite mínimo exacto (10 caracteres) es aceptado", () => {
    const r = parsearContacto(formContacto({ mensaje: "Hola mundo" })); // 10 chars
    expect(r.ok).toBe(true);
  });

  it("mensaje en el límite máximo exacto (2000 caracteres) es aceptado", () => {
    const r = parsearContacto(formContacto({ mensaje: "m".repeat(2000) }));
    expect(r.ok).toBe(true);
  });

  it("asunto en el límite máximo exacto (120 caracteres) es aceptado", () => {
    const r = parsearContacto(formContacto({ asunto: "s".repeat(120) }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.asunto).toHaveLength(120);
  });
});

// ---------------------------------------------------------------------------
// nombre field — length and presence validation
// ---------------------------------------------------------------------------

describe("parsearContacto — campo nombre", () => {
  it("nombre de 1 carácter es rechazado", () => {
    const r = parsearContacto(formContacto({ nombre: "A" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/al menos 2 caracteres/i);
  });

  it("nombre vacío es rechazado", () => {
    const r = parsearContacto(formContacto({ nombre: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBeTruthy();
  });

  it("nombre de solo espacios (equivalente a vacío tras trim) es rechazado", () => {
    const r = parsearContacto(formContacto({ nombre: "   " }));
    expect(r.ok).toBe(false);
  });

  it("nombre de 81 caracteres supera el máximo y es rechazado", () => {
    const r = parsearContacto(formContacto({ nombre: "B".repeat(81) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/demasiado largo/i);
  });

  it("nombre de 200 caracteres es rechazado", () => {
    const r = parsearContacto(formContacto({ nombre: "N".repeat(200) }));
    expect(r.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// email field — several invalid formats
// ---------------------------------------------------------------------------

describe("parsearContacto — campo email (varios formatos inválidos)", () => {
  const emailsInvalidos = [
    "no-es-correo",
    "sin-arroba.com",
    "@sinusuario.com",
    "usuario@",
    "usuario@dominio",
    "usuario @dominio.com",
    "usuario@.com",
    "",
    "   ",
  ];

  for (const emailMalo of emailsInvalidos) {
    it(`rechaza el email inválido: "${emailMalo || "(vacío)"}"`, () => {
      const r = parsearContacto(formContacto({ email: emailMalo }));
      expect(r.ok).toBe(false);
      if (!r.ok)
        expect(r.error).toMatch(/correo electrónico válido/i);
    });
  }

  it("acepta email estándar con subdominio", () => {
    const r = parsearContacto(
      formContacto({ email: "usuario@correo.empresa.hn" }),
    );
    expect(r.ok).toBe(true);
  });

  it("acepta email con caracteres especiales permitidos antes del @", () => {
    const r = parsearContacto(
      formContacto({ email: "nombre.apellido+etiqueta@example.com" }),
    );
    expect(r.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// mensaje field — length and empty cases
// ---------------------------------------------------------------------------

describe("parsearContacto — campo mensaje", () => {
  it("mensaje de 9 caracteres (< 10) es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "Hola como" })); // 9 chars
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/al menos 10 caracteres/i);
  });

  it("mensaje de 5 caracteres es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "corto" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/al menos 10 caracteres/i);
  });

  it("mensaje vacío es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "" }));
    expect(r.ok).toBe(false);
  });

  it("mensaje de solo espacios (equivalente a vacío tras trim) es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "          " })); // 10 spaces → "" after trim
    expect(r.ok).toBe(false);
  });

  it("mensaje de 2001 caracteres supera el máximo y es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "y".repeat(2001) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/mensaje es demasiado largo/i);
  });

  it("mensaje de 5000 caracteres es rechazado", () => {
    const r = parsearContacto(formContacto({ mensaje: "z".repeat(5000) }));
    expect(r.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// asunto field — length
// ---------------------------------------------------------------------------

describe("parsearContacto — campo asunto", () => {
  it("asunto de 121 caracteres supera el máximo y es rechazado", () => {
    const r = parsearContacto(formContacto({ asunto: "x".repeat(121) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/asunto es demasiado largo/i);
  });
});

// ---------------------------------------------------------------------------
// Error messages in Spanish — literal checks
// ---------------------------------------------------------------------------

describe("parsearContacto — mensajes de error en español (literales)", () => {
  it("error de nombre corto dice exactamente 'El nombre debe tener al menos 2 caracteres.'", () => {
    const r = parsearContacto(formContacto({ nombre: "X" }));
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("El nombre debe tener al menos 2 caracteres.");
  });

  it("error de mensaje corto dice exactamente 'El mensaje debe tener al menos 10 caracteres.'", () => {
    const r = parsearContacto(formContacto({ mensaje: "corto" }));
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("El mensaje debe tener al menos 10 caracteres.");
  });

  it("error de email inválido dice exactamente 'Ingresa un correo electrónico válido.'", () => {
    const r = parsearContacto(formContacto({ email: "no-es-email" }));
    expect(r.ok).toBe(false);
    if (!r.ok)
      expect(r.error).toBe("Ingresa un correo electrónico válido.");
  });

  it("error de asunto largo dice exactamente 'El asunto es demasiado largo.'", () => {
    const r = parsearContacto(formContacto({ asunto: "a".repeat(121) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El asunto es demasiado largo.");
  });

  it("error de mensaje largo dice exactamente 'El mensaje es demasiado largo.'", () => {
    const r = parsearContacto(formContacto({ mensaje: "m".repeat(2001) }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("El mensaje es demasiado largo.");
  });
});

// ---------------------------------------------------------------------------
// Honeypot (apellido2) — documented behavior of the contract
// ---------------------------------------------------------------------------

describe("parsearContacto — honeypot (apellido2)", () => {
  it("CAMPO_HONEYPOT exporta la constante 'apellido2'", () => {
    expect(CAMPO_HONEYPOT).toBe("apellido2");
  });

  it("acepta cuando el honeypot está ausente del FormData", () => {
    const r = parsearContacto(formContacto());
    expect(r.ok).toBe(true);
  });

  it("acepta cuando el honeypot viene explícitamente vacío (string vacío)", () => {
    const r = parsearContacto(formContacto({ [CAMPO_HONEYPOT]: "" }));
    expect(r.ok).toBe(true);
  });

  it("acepta cuando el honeypot es solo espacios (trim → '')", () => {
    const r = parsearContacto(formContacto({ [CAMPO_HONEYPOT]: "   " }));
    expect(r.ok).toBe(true);
  });

  it("rechaza a nivel de schema cuando el honeypot trae contenido (bot detectado)", () => {
    // The schema marks ok:false. The server action handles this SILENTLY,
    // returning { ok: true } without persisting so as not to tip off the bot.
    const r = parsearContacto(formContacto({ [CAMPO_HONEYPOT]: "soy-un-bot" }));
    expect(r.ok).toBe(false);
  });

  it("rechaza cuando el honeypot trae cualquier texto no vacío", () => {
    const r = parsearContacto(
      formContacto({ [CAMPO_HONEYPOT]: "info@spam.com" }),
    );
    expect(r.ok).toBe(false);
  });

  it("un humano real (honeypot vacío) siempre pasa la validación del honeypot", () => {
    // Simulates a human submit: all fields correct, honeypot empty
    const r = parsearContacto(
      formContacto({
        nombre: "Roberto Flores",
        email: "roberto@example.hn",
        asunto: "Pedido de cuadernos",
        mensaje: "¿Tienen disponibles cuadernos universitarios de 200 hojas?",
        [CAMPO_HONEYPOT]: "",
      }),
    );
    expect(r.ok).toBe(true);
  });
});
