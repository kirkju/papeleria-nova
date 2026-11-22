/**
 * Integrity tests for the Papelería Nova blog content
 * (src/contenido/blog.ts).
 *
 * They do not test rendering: they test that the DATA is correct and complete
 * before Next.js consumes it to generate the prerendered pages /blog and
 * /blog/[slug]. Broken data here would cause a silent 404 or invalid SEO.
 *
 * Fixed reference date: 2026-06-12 (the day of the test).
 * Publication dates must be <= that date so that the sitemap does not
 * announce articles "from the future".
 */
import { describe, it, expect } from "vitest";
import {
  ARTICULOS_BLOG,
  obtenerArticulo,
  articulosRelacionados,
} from "./blog";

/** Fixed reference date for the tests (do not use Date.now). */
const FECHA_REFERENCIA = new Date("2026-06-12T00:00:00.000Z");

// ---------------------------------------------------------------------------
// Slugs — uniqueness and kebab-case format
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — slugs", () => {
  it("todos los artículos tienen slug no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.slug.length).toBeGreaterThan(0);
    }
  });

  it("los slugs son únicos (sin duplicados)", () => {
    const slugs = ARTICULOS_BLOG.map((a) => a.slug);
    const unicos = new Set(slugs);
    expect(unicos.size).toBe(slugs.length);
  });

  it("los slugs tienen formato kebab-case (solo minúsculas, números y guiones)", () => {
    const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        kebabCase.test(articulo.slug),
        `El slug "${articulo.slug}" no es kebab-case válido`,
      ).toBe(true);
    }
  });

  it("ningún slug contiene espacios", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.slug).not.toContain(" ");
    }
  });

  it("ningún slug contiene mayúsculas", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.slug).toBe(articulo.slug.toLowerCase());
    }
  });

  it("ningún slug contiene guión bajo", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.slug).not.toContain("_");
    }
  });
});

// ---------------------------------------------------------------------------
// Dates — valid ISO format and not in the future
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — fechas de publicación", () => {
  it("todas las fechas son strings ISO válidos (parseables por Date)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      const fecha = new Date(articulo.fecha);
      expect(
        isNaN(fecha.getTime()),
        `La fecha "${articulo.fecha}" en el artículo "${articulo.slug}" no es una fecha válida`,
      ).toBe(false);
    }
  });

  it("ninguna fecha es futura respecto a 2026-06-12 (el build debe ser determinista)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      const fecha = new Date(articulo.fecha);
      expect(
        fecha.getTime() <= FECHA_REFERENCIA.getTime(),
        `El artículo "${articulo.slug}" tiene fecha futura: ${articulo.fecha}`,
      ).toBe(true);
    }
  });

  it("todas las fechas tienen año razonable (>= 2024)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      const anio = new Date(articulo.fecha).getFullYear();
      expect(
        anio,
        `El año ${anio} en "${articulo.slug}" parece incorrecto`,
      ).toBeGreaterThanOrEqual(2024);
    }
  });

  it("las fechas son strings, no objetos Date (para que el build sea determinista)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(typeof articulo.fecha).toBe("string");
    }
  });
});

// ---------------------------------------------------------------------------
// Description — length for SEO
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — descripción (SEO)", () => {
  it("todas las descripciones tienen al menos 100 caracteres", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.descripcion.length,
        `Descripción de "${articulo.slug}" tiene solo ${articulo.descripcion.length} chars (mínimo 100)`,
      ).toBeGreaterThanOrEqual(100);
    }
  });

  it("todas las descripciones tienen como máximo 170 caracteres", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.descripcion.length,
        `Descripción de "${articulo.slug}" tiene ${articulo.descripcion.length} chars (máximo 170)`,
      ).toBeLessThanOrEqual(170);
    }
  });

  it("ninguna descripción está vacía", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.descripcion.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Cover — local path
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — portada", () => {
  it("todas las portadas empiezan con '/' (ruta local relativa a /public)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.portada.startsWith("/"),
        `La portada de "${articulo.slug}" no empieza con /: "${articulo.portada}"`,
      ).toBe(true);
    }
  });

  it("ninguna portada es una URL externa (http/https)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.portada.startsWith("http"),
        `La portada de "${articulo.slug}" es una URL externa`,
      ).toBe(false);
    }
  });

  it("todas las portadas tienen texto alternativo (portadaAlt) no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.portadaAlt.trim().length,
        `El artículo "${articulo.slug}" no tiene portadaAlt`,
      ).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Titles — presence and uniqueness
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — títulos", () => {
  it("todos los artículos tienen título no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.titulo.trim().length,
        `El artículo "${articulo.slug}" tiene título vacío`,
      ).toBeGreaterThan(0);
    }
  });

  it("los títulos son únicos (sin duplicados)", () => {
    const titulos = ARTICULOS_BLOG.map((a) => a.titulo);
    const unicos = new Set(titulos);
    expect(unicos.size).toBe(titulos.length);
  });
});

// ---------------------------------------------------------------------------
// Content — minimum blocks
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — contenido (bloques)", () => {
  it("todos los artículos tienen al menos 3 bloques de contenido", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(
        articulo.contenido.length,
        `El artículo "${articulo.slug}" tiene solo ${articulo.contenido.length} bloques (mínimo 3)`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("todos los bloques tienen un tipo reconocido ('p', 'h2' o 'lista')", () => {
    const tiposValidos = new Set(["p", "h2", "lista"]);
    for (const articulo of ARTICULOS_BLOG) {
      for (const bloque of articulo.contenido) {
        expect(
          tiposValidos.has(bloque.tipo),
          `Bloque con tipo desconocido "${bloque.tipo}" en "${articulo.slug}"`,
        ).toBe(true);
      }
    }
  });

  it("los bloques de tipo 'p' y 'h2' tienen texto no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      for (const bloque of articulo.contenido) {
        if (bloque.tipo === "p" || bloque.tipo === "h2") {
          expect(
            bloque.texto.trim().length,
            `Bloque ${bloque.tipo} vacío en "${articulo.slug}"`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("los bloques de tipo 'lista' tienen al menos 1 ítem no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      for (const bloque of articulo.contenido) {
        if (bloque.tipo === "lista") {
          expect(
            bloque.items.length,
            `Lista vacía en "${articulo.slug}"`,
          ).toBeGreaterThan(0);
          for (const item of bloque.items) {
            expect(
              item.trim().length,
              `Ítem vacío en lista de "${articulo.slug}"`,
            ).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("cada artículo tiene al menos un bloque de tipo 'p' (cuerpo narrativo)", () => {
    for (const articulo of ARTICULOS_BLOG) {
      const tieneParrafo = articulo.contenido.some((b) => b.tipo === "p");
      expect(
        tieneParrafo,
        `El artículo "${articulo.slug}" no tiene ningún párrafo`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Additional metadata
// ---------------------------------------------------------------------------

describe("ARTICULOS_BLOG — metadatos (autor, categoria)", () => {
  it("todos los artículos tienen autor no vacío", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.autor.trim().length).toBeGreaterThan(0);
    }
  });

  it("todos los artículos tienen categoría no vacía", () => {
    for (const articulo of ARTICULOS_BLOG) {
      expect(articulo.categoria.trim().length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Helper functions: obtenerArticulo and articulosRelacionados
// ---------------------------------------------------------------------------

describe("obtenerArticulo — búsqueda por slug", () => {
  it("devuelve el artículo correcto para un slug existente", () => {
    const primerSlug = ARTICULOS_BLOG[0]?.slug;
    if (!primerSlug) return;
    const articulo = obtenerArticulo(primerSlug);
    expect(articulo).toBeDefined();
    expect(articulo?.slug).toBe(primerSlug);
  });

  it("devuelve undefined para un slug inexistente", () => {
    const resultado = obtenerArticulo("slug-que-no-existe-jamas");
    expect(resultado).toBeUndefined();
  });

  it("devuelve undefined para string vacío", () => {
    const resultado = obtenerArticulo("");
    expect(resultado).toBeUndefined();
  });

  it("todos los slugs del array se pueden recuperar individualmente", () => {
    for (const articulo of ARTICULOS_BLOG) {
      const encontrado = obtenerArticulo(articulo.slug);
      expect(encontrado).toBeDefined();
      expect(encontrado?.slug).toBe(articulo.slug);
    }
  });
});

describe("articulosRelacionados — sugerencias por slug", () => {
  it("no incluye el artículo cuyo slug se excluye", () => {
    const slugActual = ARTICULOS_BLOG[0]?.slug;
    if (!slugActual) return;
    const relacionados = articulosRelacionados(slugActual);
    const incluye = relacionados.some((a) => a.slug === slugActual);
    expect(incluye).toBe(false);
  });

  it("respeta el límite por defecto (2)", () => {
    const slug = ARTICULOS_BLOG[0]?.slug ?? "inexistente";
    const relacionados = articulosRelacionados(slug);
    expect(relacionados.length).toBeLessThanOrEqual(2);
  });

  it("respeta un límite personalizado de 1", () => {
    const slug = ARTICULOS_BLOG[0]?.slug ?? "inexistente";
    const relacionados = articulosRelacionados(slug, 1);
    expect(relacionados.length).toBeLessThanOrEqual(1);
  });

  it("devuelve todos los demás cuando el límite es mayor al total disponible", () => {
    const slug = ARTICULOS_BLOG[0]?.slug ?? "inexistente";
    const relacionados = articulosRelacionados(slug, 999);
    // It must return all of them except the excluded article
    expect(relacionados.length).toBe(ARTICULOS_BLOG.length - 1);
  });

  it("para un slug inexistente devuelve hasta el límite de todos los artículos", () => {
    const relacionados = articulosRelacionados("slug-que-no-existe", 2);
    expect(relacionados.length).toBeLessThanOrEqual(2);
  });
});
