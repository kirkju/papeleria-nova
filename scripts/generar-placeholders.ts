/**
 * DETERMINISTIC generator of placeholder images (SVG) for the catalog.
 *
 * Run with:  npx tsx scripts/generar-placeholders.ts
 *
 * Reuses CATALOGO/toSlug from prisma/datos.ts to match EXACTLY the slugs the
 * seed uses (images point to /productos/<slug>.svg and
 * /categorias/<slug>.svg). It does not use Math.random: the same input yields
 * the same SVG (idempotent, safe to keep under version control).
 *
 * Visual language (consistent with the store's design system): a background in
 * the category tint, a stationery motif of its own per category drawn with
 * simple SVG strokes (pencil, spiral, brush, backpack, paper clip, laptop,
 * scissors, ruler), the product name/initial in a serif typeface and a small
 * "Papelería Nova" stamp. Intentional, not cluttered clipart.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CATALOGO, toSlug } from "../prisma/datos";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAIZ = join(__dirname, "..");
const DIR_PRODUCTOS = join(RAIZ, "public", "productos");
const DIR_CATEGORIAS = join(RAIZ, "public", "categorias");

/* ── Tint palette per category (mirror of tokens.css, light) ───────────────── */
const TINTE_CAT: Record<string, { fondo: string; tinta: string; acento: string }> = {
  escritura: { fondo: "#e9ecf8", tinta: "#3b3b8f", acento: "#f0643c" },
  cuadernos: { fondo: "#fdeee2", tinta: "#c2542f", acento: "#3b3b8f" },
  arte: { fondo: "#e8f3ec", tinta: "#2f7d57", acento: "#f0643c" },
  oficina: { fondo: "#f2ecf8", tinta: "#6a4a9c", acento: "#f0643c" },
  mochilas: { fondo: "#fbf0db", tinta: "#a9772a", acento: "#3b3b8f" },
  manualidades: { fondo: "#e6eef2", tinta: "#3a6a82", acento: "#f0643c" },
  tecnologia: { fondo: "#e4eef0", tinta: "#2f6b73", acento: "#f0643c" },
  geometria: { fondo: "#f3ebe3", tinta: "#8a5a36", acento: "#3b3b8f" },
};

const TINTE_DEFECTO = { fondo: "#f3ece0", tinta: "#4a463e", acento: "#f0643c" };

/* ── SVG-safe text utilities ───────────────────────────────────────────────── */
function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Short name: up to `max` characters on one clean line (no ugly cut). */
function nombreCorto(nombre: string, max = 22): string {
  const limpio = nombre.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const recorte = limpio.slice(0, max);
  const ultimoEspacio = recorte.lastIndexOf(" ");
  return (ultimoEspacio > 10 ? recorte.slice(0, ultimoEspacio) : recorte).trim() + "…";
}

/** Meaningful initial of the product (first alphabetic letter, uppercased). */
function inicial(nombre: string): string {
  const m = nombre.match(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/);
  return (m?.[0] ?? "•").toUpperCase();
}

/**
 * Stationery motif per category: simple SVG strokes, monochrome in `tinta`
 * with a touch of `acento`. Meant to sit in an area of roughly 320x320.
 */
function motivo(slug: string, tinta: string, acento: string): string {
  const t = tinta;
  const a = acento;
  switch (slug) {
    case "escritura": // diagonal pencil
      return `<g transform="rotate(-34 160 160)" fill="none" stroke="${t}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="78" y="142" width="150" height="36" rx="6" fill="${t}" stroke="none"/>
        <polygon points="228,142 264,160 228,178" fill="#f6efe2" stroke="${t}"/>
        <polygon points="248,151 264,160 248,169" fill="${a}" stroke="none"/>
        <rect x="62" y="142" width="18" height="36" rx="4" fill="${a}" stroke="none"/>
      </g>`;
    case "cuadernos": // notebook spiral with ruled lines
      return `<g fill="none" stroke="${t}" stroke-width="5" stroke-linecap="round">
        <rect x="78" y="64" width="190" height="232" rx="16" fill="#f6efe2" stroke="${t}" stroke-width="6"/>
        <line x1="112" y1="70" x2="112" y2="290" stroke="${a}" stroke-width="4"/>
        ${[112, 144, 176, 208, 240].map((y) => `<line x1="128" y1="${y}" x2="244" y2="${y}" stroke="${t}" stroke-width="4"/>`).join("")}
        ${[80, 112, 144, 176, 208, 240, 272].map((y) => `<circle cx="78" cy="${y}" r="7" fill="#f6efe2" stroke="${t}" stroke-width="4"/>`).join("")}
      </g>`;
    case "arte": // brush with a drop of paint
      return `<g transform="rotate(28 160 160)" fill="none" stroke="${t}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="148" y="60" width="24" height="150" rx="8" fill="${t}" stroke="none"/>
        <rect x="142" y="200" width="36" height="26" rx="6" fill="${a}" stroke="none"/>
        <path d="M144 226 q16 56 16 64 q0-8 16-64 z" fill="${t}" stroke="none"/>
        <circle cx="205" cy="250" r="14" fill="${a}" stroke="none"/>
      </g>`;
    case "mochilas": // simple backpack
      return `<g fill="none" stroke="${t}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M104 120 q56-44 112 0 v126 q0 22-22 22 h-68 q-22 0-22-22 z" fill="#f6efe2" stroke="${t}"/>
        <path d="M132 96 q28-26 56 0" stroke="${t}"/>
        <rect x="128" y="168" width="64" height="56" rx="12" fill="${a}" stroke="none"/>
        <line x1="160" y1="168" x2="160" y2="224" stroke="#f6efe2" stroke-width="5"/>
      </g>`;
    case "oficina": // paper clip
      return `<g fill="none" stroke="${t}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" transform="rotate(20 160 160)">
        <path d="M124 86 v120 a36 36 0 0 0 72 0 v-96 a22 22 0 0 0 -44 0 v96 a8 8 0 0 0 16 0 v-84"/>
        <circle cx="168" cy="232" r="6" fill="${a}" stroke="none"/>
      </g>`;
    case "tecnologia": // laptop
      return `<g fill="none" stroke="${t}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
        <rect x="92" y="92" width="136" height="92" rx="10" fill="#f6efe2" stroke="${t}"/>
        <rect x="108" y="108" width="104" height="60" rx="4" fill="${a}" opacity="0.18" stroke="none"/>
        <circle cx="160" cy="138" r="14" fill="none" stroke="${a}" stroke-width="5"/>
        <path d="M72 184 h176 l14 28 a8 8 0 0 1-7 12 H65 a8 8 0 0 1-7-12 z" fill="${t}" stroke="none"/>
        <rect x="138" y="190" width="44" height="8" rx="4" fill="#f6efe2" stroke="none"/>
      </g>`;
    case "manualidades": // scissors
      return `<g fill="none" stroke="${t}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="rotate(-18 160 160)">
        <circle cx="118" cy="222" r="22"/>
        <circle cx="170" cy="222" r="22" stroke="${a}"/>
        <path d="M118 200 L226 92"/>
        <path d="M170 200 L226 132" stroke="${a}"/>
        <circle cx="186" cy="150" r="6" fill="${t}" stroke="none"/>
      </g>`;
    case "geometria": // ruler + set square (triangle)
      return `<g fill="none" stroke="${t}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="84,238 236,238 84,108" fill="#f6efe2" stroke="${t}" stroke-width="6"/>
        ${[108, 132, 156, 180, 204].map((x) => `<line x1="${x}" y1="238" x2="${x}" y2="226" stroke="${t}" stroke-width="4"/>`).join("")}
        <g transform="rotate(34 248 150)">
          <rect x="180" y="120" width="150" height="30" rx="6" fill="${a}" stroke="none"/>
          ${[196, 214, 232, 250, 268, 286, 304].map((x, i) => `<line x1="${x}" y1="120" x2="${x}" y2="${i % 2 ? 132 : 138}" stroke="#f6efe2" stroke-width="3"/>`).join("")}
        </g>
      </g>`;
    default: // subtle star
      return `<circle cx="160" cy="160" r="70" fill="none" stroke="${t}" stroke-width="6"/>`;
  }
}

/** Reusable "Papelería Nova" stamp, positioned with translate. */
function sello(x: number, y: number, tinta: string): string {
  return `<g transform="translate(${x} ${y})" opacity="0.85">
    <circle cx="0" cy="0" r="3.2" fill="${tinta}"/>
    <text x="12" y="4.5" font-family="Georgia, 'Times New Roman', serif" font-size="15" font-style="italic" fill="${tinta}">Papelería Nova</text>
  </g>`;
}

/** Very faint notebook lines as a background texture. */
function texturaLineas(ancho: number, alto: number, tinta: string): string {
  const lineas: string[] = [];
  for (let y = 60; y < alto - 40; y += 38) {
    lineas.push(`<line x1="0" y1="${y}" x2="${ancho}" y2="${y}" stroke="${tinta}" stroke-width="1" opacity="0.05"/>`);
  }
  return lineas.join("");
}

/* ── Product SVG: 800x800 ─────────────────────────────────────────────────── */
function svgProducto(nombre: string, catSlug: string): string {
  const tinte = TINTE_CAT[catSlug] ?? TINTE_DEFECTO;
  const titulo = escaparXml(nombreCorto(nombre));
  const ini = escaparXml(inicial(nombre));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${escaparXml(nombre)}">
  <rect width="800" height="800" fill="${tinte.fondo}"/>
  ${texturaLineas(800, 800, tinte.tinta)}
  <rect x="40" y="40" width="720" height="720" rx="36" fill="none" stroke="${tinte.tinta}" stroke-width="2" opacity="0.14"/>

  <!-- Inicial grande de marca de agua -->
  <text x="640" y="690" font-family="Georgia, 'Times New Roman', serif" font-size="340" font-weight="700" fill="${tinte.tinta}" opacity="0.07" text-anchor="middle">${ini}</text>

  <!-- Motivo de papelería de la categoría, centrado arriba -->
  <g transform="translate(240 120) scale(1)">
    ${motivo(catSlug, tinte.tinta, tinte.acento)}
  </g>

  <!-- Nombre del producto en serif -->
  <text x="400" y="600" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="600" fill="${tinte.tinta}" text-anchor="middle" letter-spacing="-0.5">${titulo}</text>

  <!-- Etiqueta de categoría -->
  <text x="400" y="648" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-style="italic" fill="${tinte.tinta}" opacity="0.7" text-anchor="middle">${escaparXml(catSlug)}</text>

  ${sello(300, 720, tinte.tinta)}
</svg>`;
}

/* ── Category SVG: 1200x800 ───────────────────────────────────────────────── */
function svgCategoria(nombre: string, catSlug: string): string {
  const tinte = TINTE_CAT[catSlug] ?? TINTE_DEFECTO;
  const titulo = escaparXml(nombre);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" role="img" aria-label="Categoría ${escaparXml(nombre)}">
  <rect width="1200" height="800" fill="${tinte.fondo}"/>
  ${texturaLineas(1200, 800, tinte.tinta)}
  <rect x="48" y="48" width="1104" height="704" rx="44" fill="none" stroke="${tinte.tinta}" stroke-width="2" opacity="0.14"/>

  <!-- Texto a la izquierda (composición asimétrica) -->
  <text x="96" y="380" font-family="Georgia, 'Times New Roman', serif" font-size="96" font-weight="700" fill="${tinte.tinta}" letter-spacing="-2">${titulo}</text>
  <line x1="100" y1="420" x2="280" y2="420" stroke="${tinte.acento}" stroke-width="6" stroke-linecap="round"/>
  <text x="100" y="470" font-family="Georgia, 'Times New Roman', serif" font-size="28" font-style="italic" fill="${tinte.tinta}" opacity="0.7">Papelería Nova · útiles con carácter</text>

  <!-- Motivo grande a la derecha, con leve rotación -->
  <g transform="translate(720 200) scale(1.7) rotate(-6 160 160)">
    ${motivo(catSlug, tinte.tinta, tinte.acento)}
  </g>

  ${sello(96, 712, tinte.tinta)}
</svg>`;
}

/* ── Generation ───────────────────────────────────────────────────────────── */
function main(): void {
  mkdirSync(DIR_PRODUCTOS, { recursive: true });
  mkdirSync(DIR_CATEGORIAS, { recursive: true });

  let nProductos = 0;
  let nCategorias = 0;

  // Generic fallback for when a product has no mapped image.
  writeFileSync(
    join(DIR_PRODUCTOS, "placeholder.svg"),
    svgProducto("Papelería Nova", "geometria"),
    "utf8",
  );

  for (const categoria of CATALOGO) {
    const catSlug = toSlug(categoria.nombre);

    const svgCat = svgCategoria(categoria.nombre, catSlug);
    writeFileSync(join(DIR_CATEGORIAS, `${catSlug}.svg`), svgCat, "utf8");
    nCategorias += 1;

    for (const producto of categoria.productos) {
      const slug = toSlug(producto.nombre);
      const svg = svgProducto(producto.nombre, catSlug);
      writeFileSync(join(DIR_PRODUCTOS, `${slug}.svg`), svg, "utf8");
      nProductos += 1;
    }
  }

  // Check against the seed.
  const esperadosProductos = CATALOGO.reduce((acc, c) => acc + c.productos.length, 0);
  const esperadasCategorias = CATALOGO.length;

  console.log(`Categorías generadas: ${nCategorias}/${esperadasCategorias}`);
  console.log(`Productos generados:  ${nProductos}/${esperadosProductos}`);

  if (nProductos !== esperadosProductos || nCategorias !== esperadasCategorias) {
    console.error("✗ El conteo no coincide con el catálogo. Revisa prisma/datos.ts.");
    process.exit(1);
  }
  console.log("✓ Placeholders SVG generados correctamente.");
}

main();
