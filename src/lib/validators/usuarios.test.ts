/**
 * Tests for the admin's user management validator (PURE).
 *
 * Covers:
 *  - parsearFiltrosUsuarios: defaults, valid values, total garbage, trimming of q,
 *    rol the 3 valid ones + "todos" + invalid => "todos", estado the 3 values + invalid
 *    => "todos", page "abc"/-1/0 => 1, repeated arrays use the first one, never throws.
 *  - rolUsuarioSchema: accepts exactly CLIENTE/VENDEDOR/ADMIN; rejects lowercase,
 *    "todos", empty, null, numbers.
 *  - ETIQUETA_ROL: 3 entries in correct Spanish.
 */
import { describe, it, expect } from "vitest";
import {
  parsearFiltrosUsuarios,
  rolUsuarioSchema,
  ETIQUETA_ROL,
  ROLES_FILTRO,
  ESTADOS_USUARIO_FILTRO,
  ROLES_USUARIO,
} from "./usuarios";

// ── parsearFiltrosUsuarios ────────────────────────────────────────────────────

describe("parsearFiltrosUsuarios — defaults con entrada vacía", () => {
  it("devuelve defaults completos cuando no hay parámetros", () => {
    const f = parsearFiltrosUsuarios({});
    expect(f.q).toBeUndefined();
    expect(f.rol).toBe("todos");
    expect(f.estado).toBe("todos");
    expect(f.page).toBe(1);
  });

  it("devuelve defaults cuando todos los parámetros son basura total", () => {
    const f = parsearFiltrosUsuarios({
      q: "   ",
      rol: "SUPERADMIN",
      estado: "baneado",
      page: "xyz",
    });
    expect(f.q).toBeUndefined();
    expect(f.rol).toBe("todos");
    expect(f.estado).toBe("todos");
    expect(f.page).toBe(1);
  });

  it("nunca lanza con basura total en todos los campos", () => {
    expect(() =>
      parsearFiltrosUsuarios({
        q: ["", "   "],
        rol: "NADA",
        estado: "INVENTADO",
        page: ["-5", "abc"],
      }),
    ).not.toThrow();
  });
});

describe("parsearFiltrosUsuarios — campo q (búsqueda de texto)", () => {
  it("recorta espacios al inicio y al final de q", () => {
    const f = parsearFiltrosUsuarios({ q: "  ana garcía  " });
    expect(f.q).toBe("ana garcía");
  });

  it("q vacío tras trim queda undefined", () => {
    expect(parsearFiltrosUsuarios({ q: "   " }).q).toBeUndefined();
    expect(parsearFiltrosUsuarios({ q: "" }).q).toBeUndefined();
  });

  it("q ausente queda undefined", () => {
    expect(parsearFiltrosUsuarios({}).q).toBeUndefined();
  });

  it("q con texto válido se conserva", () => {
    expect(parsearFiltrosUsuarios({ q: "pedro" }).q).toBe("pedro");
  });

  it("q con email se conserva", () => {
    expect(parsearFiltrosUsuarios({ q: "ana@nova.hn" }).q).toBe("ana@nova.hn");
  });
});

describe("parsearFiltrosUsuarios — campo rol", () => {
  it("acepta rol 'CLIENTE' correctamente", () => {
    expect(parsearFiltrosUsuarios({ rol: "CLIENTE" }).rol).toBe("CLIENTE");
  });

  it("acepta rol 'VENDEDOR' correctamente", () => {
    expect(parsearFiltrosUsuarios({ rol: "VENDEDOR" }).rol).toBe("VENDEDOR");
  });

  it("acepta rol 'ADMIN' correctamente", () => {
    expect(parsearFiltrosUsuarios({ rol: "ADMIN" }).rol).toBe("ADMIN");
  });

  it("acepta rol 'todos' y lo conserva", () => {
    expect(parsearFiltrosUsuarios({ rol: "todos" }).rol).toBe("todos");
  });

  it("rol inválido cae a 'todos' (parser TOTAL)", () => {
    expect(parsearFiltrosUsuarios({ rol: "SUPERADMIN" }).rol).toBe("todos");
  });

  it("rol en minúsculas ('cliente') cae a 'todos' (enum es case-sensitive)", () => {
    expect(parsearFiltrosUsuarios({ rol: "cliente" }).rol).toBe("todos");
  });

  it("rol vacío cae a 'todos'", () => {
    expect(parsearFiltrosUsuarios({ rol: "" }).rol).toBe("todos");
  });
});

describe("parsearFiltrosUsuarios — campo estado", () => {
  it("acepta estado 'todos' correctamente", () => {
    expect(parsearFiltrosUsuarios({ estado: "todos" }).estado).toBe("todos");
  });

  it("acepta estado 'activos' correctamente", () => {
    expect(parsearFiltrosUsuarios({ estado: "activos" }).estado).toBe("activos");
  });

  it("acepta estado 'inactivos' correctamente", () => {
    expect(parsearFiltrosUsuarios({ estado: "inactivos" }).estado).toBe("inactivos");
  });

  it("estado inválido 'baneado' cae a 'todos' (parser TOTAL)", () => {
    expect(parsearFiltrosUsuarios({ estado: "baneado" }).estado).toBe("todos");
  });

  it("estado en mayúsculas ('ACTIVOS') cae a 'todos' (enum es case-sensitive)", () => {
    expect(parsearFiltrosUsuarios({ estado: "ACTIVOS" }).estado).toBe("todos");
  });

  it("estado vacío cae a 'todos'", () => {
    expect(parsearFiltrosUsuarios({ estado: "" }).estado).toBe("todos");
  });
});

describe("parsearFiltrosUsuarios — campo page", () => {
  it("page 'abc' cae a 1 (no numérico)", () => {
    expect(parsearFiltrosUsuarios({ page: "abc" }).page).toBe(1);
  });

  it("page '-1' cae a 1 (negativo, mínimo es 1)", () => {
    expect(parsearFiltrosUsuarios({ page: "-1" }).page).toBe(1);
  });

  it("page '0' cae a 1 (mínimo es 1)", () => {
    expect(parsearFiltrosUsuarios({ page: "0" }).page).toBe(1);
  });

  it("page '1' es válida y se conserva", () => {
    expect(parsearFiltrosUsuarios({ page: "1" }).page).toBe(1);
  });

  it("page '5' válida se parsea como 5", () => {
    expect(parsearFiltrosUsuarios({ page: "5" }).page).toBe(5);
  });

  it("page ausente es 1 por default", () => {
    expect(parsearFiltrosUsuarios({}).page).toBe(1);
  });
});

describe("parsearFiltrosUsuarios — parámetros repetidos como array", () => {
  it("page repetida como array usa el primer valor", () => {
    expect(parsearFiltrosUsuarios({ page: ["3", "9"] }).page).toBe(3);
  });

  it("q repetido como array usa el primer valor", () => {
    expect(parsearFiltrosUsuarios({ q: ["ana", "pedro"] }).q).toBe("ana");
  });

  it("rol repetido como array usa el primer valor", () => {
    expect(parsearFiltrosUsuarios({ rol: ["CLIENTE", "ADMIN"] }).rol).toBe("CLIENTE");
  });

  it("estado repetido como array usa el primer valor", () => {
    expect(parsearFiltrosUsuarios({ estado: ["activos", "inactivos"] }).estado).toBe("activos");
  });

  it("array con primer valor inválido cae a default aunque el segundo sea válido", () => {
    // primero() takes the first one, which is invalid => falls back to the default
    expect(parsearFiltrosUsuarios({ rol: ["INVALIDO", "CLIENTE"] }).rol).toBe("todos");
  });
});

describe("parsearFiltrosUsuarios — combinaciones válidas completas", () => {
  it("acepta todos los campos válidos juntos y los devuelve normalizados", () => {
    const f = parsearFiltrosUsuarios({
      q: "  berta  ",
      rol: "VENDEDOR",
      estado: "inactivos",
      page: "4",
    });
    expect(f.q).toBe("berta");
    expect(f.rol).toBe("VENDEDOR");
    expect(f.estado).toBe("inactivos");
    expect(f.page).toBe(4);
  });

  it("acepta búsqueda con rol y estado, sin page (default 1)", () => {
    const f = parsearFiltrosUsuarios({ q: "nova", rol: "ADMIN", estado: "activos" });
    expect(f.q).toBe("nova");
    expect(f.rol).toBe("ADMIN");
    expect(f.estado).toBe("activos");
    expect(f.page).toBe(1);
  });
});

// ── rolUsuarioSchema ──────────────────────────────────────────────────────────

describe("rolUsuarioSchema — acepta los 3 roles válidos", () => {
  it("acepta 'CLIENTE'", () => {
    const res = rolUsuarioSchema.safeParse("CLIENTE");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe("CLIENTE");
  });

  it("acepta 'VENDEDOR'", () => {
    const res = rolUsuarioSchema.safeParse("VENDEDOR");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe("VENDEDOR");
  });

  it("acepta 'ADMIN'", () => {
    const res = rolUsuarioSchema.safeParse("ADMIN");
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toBe("ADMIN");
  });
});

describe("rolUsuarioSchema — rechaza entradas inválidas", () => {
  it("rechaza 'cliente' en minúsculas (enum es case-sensitive)", () => {
    expect(rolUsuarioSchema.safeParse("cliente").success).toBe(false);
  });

  it("rechaza 'vendedor' en minúsculas", () => {
    expect(rolUsuarioSchema.safeParse("vendedor").success).toBe(false);
  });

  it("rechaza 'admin' en minúsculas", () => {
    expect(rolUsuarioSchema.safeParse("admin").success).toBe(false);
  });

  it("rechaza 'todos' (valor de filtro, no es rol real)", () => {
    expect(rolUsuarioSchema.safeParse("todos").success).toBe(false);
  });

  it("rechaza string vacío", () => {
    expect(rolUsuarioSchema.safeParse("").success).toBe(false);
  });

  it("rechaza null", () => {
    expect(rolUsuarioSchema.safeParse(null).success).toBe(false);
  });

  it("rechaza undefined", () => {
    expect(rolUsuarioSchema.safeParse(undefined).success).toBe(false);
  });

  it("rechaza número (por ejemplo 1)", () => {
    expect(rolUsuarioSchema.safeParse(1).success).toBe(false);
  });

  it("rechaza número 0", () => {
    expect(rolUsuarioSchema.safeParse(0).success).toBe(false);
  });

  it("rechaza 'INVITADO' (no es un rol de la DB)", () => {
    expect(rolUsuarioSchema.safeParse("INVITADO").success).toBe(false);
  });

  it("rechaza 'SUPERADMIN'", () => {
    expect(rolUsuarioSchema.safeParse("SUPERADMIN").success).toBe(false);
  });

  it("rechaza objeto plano", () => {
    expect(rolUsuarioSchema.safeParse({ role: "ADMIN" }).success).toBe(false);
  });

  it("rechaza array de roles válidos (no es string)", () => {
    expect(rolUsuarioSchema.safeParse(["ADMIN", "CLIENTE"]).success).toBe(false);
  });
});

// ── ETIQUETA_ROL ──────────────────────────────────────────────────────────────

describe("ETIQUETA_ROL — etiquetas en español", () => {
  it("CLIENTE tiene etiqueta 'Cliente'", () => {
    expect(ETIQUETA_ROL.CLIENTE).toBe("Cliente");
  });

  it("VENDEDOR tiene etiqueta 'Vendedor'", () => {
    expect(ETIQUETA_ROL.VENDEDOR).toBe("Vendedor");
  });

  it("ADMIN tiene etiqueta 'Administrador'", () => {
    expect(ETIQUETA_ROL.ADMIN).toBe("Administrador");
  });

  it("tiene exactamente 3 entradas (una por cada rol)", () => {
    expect(Object.keys(ETIQUETA_ROL)).toHaveLength(3);
  });

  it("todas las etiquetas son strings no vacíos", () => {
    for (const etiqueta of Object.values(ETIQUETA_ROL)) {
      expect(typeof etiqueta).toBe("string");
      expect(etiqueta.length).toBeGreaterThan(0);
    }
  });
});

// ── Exported constants ────────────────────────────────────────────────────────

describe("ROLES_USUARIO — los 3 roles reales de Prisma", () => {
  it("contiene exactamente CLIENTE, VENDEDOR y ADMIN", () => {
    expect(ROLES_USUARIO).toContain("CLIENTE");
    expect(ROLES_USUARIO).toContain("VENDEDOR");
    expect(ROLES_USUARIO).toContain("ADMIN");
    expect(ROLES_USUARIO).toHaveLength(3);
  });
});

describe("ROLES_FILTRO — opciones del select de filtro", () => {
  it("tiene 4 opciones: todos + los 3 roles", () => {
    expect(ROLES_FILTRO).toHaveLength(4);
  });

  it("el primer valor es 'todos' (default)", () => {
    expect(ROLES_FILTRO[0].value).toBe("todos");
  });

  it("incluye los 3 roles reales con sus etiquetas", () => {
    const valores = ROLES_FILTRO.map((r) => r.value);
    expect(valores).toContain("CLIENTE");
    expect(valores).toContain("VENDEDOR");
    expect(valores).toContain("ADMIN");
  });

  it("todas las opciones tienen label en español no vacío", () => {
    for (const opcion of ROLES_FILTRO) {
      expect(typeof opcion.label).toBe("string");
      expect(opcion.label.length).toBeGreaterThan(0);
    }
  });

  it("la etiqueta de 'todos' menciona roles", () => {
    const opcionTodos = ROLES_FILTRO.find((r) => r.value === "todos");
    expect(opcionTodos?.label.toLowerCase()).toContain("rol");
  });
});

describe("ESTADOS_USUARIO_FILTRO — opciones del select de estado", () => {
  it("tiene 3 opciones: todos, activos, inactivos", () => {
    expect(ESTADOS_USUARIO_FILTRO).toHaveLength(3);
  });

  it("el primer valor es 'todos' (default)", () => {
    expect(ESTADOS_USUARIO_FILTRO[0].value).toBe("todos");
  });

  it("incluye 'activos' e 'inactivos'", () => {
    const valores = ESTADOS_USUARIO_FILTRO.map((e) => e.value);
    expect(valores).toContain("activos");
    expect(valores).toContain("inactivos");
  });

  it("todas las opciones tienen label en español no vacío", () => {
    for (const opcion of ESTADOS_USUARIO_FILTRO) {
      expect(typeof opcion.label).toBe("string");
      expect(opcion.label.length).toBeGreaterThan(0);
    }
  });
});
