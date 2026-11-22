/**
 * Shared catalog data for Papelería Nova.
 *
 * Single source of truth for the seed categories and products. It was extracted
 * from `prisma/seed.ts` so that other scripts (e.g. placeholder image
 * generation) reuse EXACTLY the same slugs without duplicating data.
 *
 * IMPORTANT: this file must NOT import PrismaClient or any runtime
 * dependency. Data and the slug helper only, so it can be used from any
 * Node/tsx script.
 */

/** Helper: slug from a name (no accents, lowercase, hyphens). */
export function toSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type ProductoSeed = {
  nombre: string;
  descripcion: string;
  precio: string;
  comparePrice?: string;
  sku: string;
  stock: number;
  marca: string;
  destacado?: boolean;
  activo?: boolean;
};

export type CategoriaSeed = {
  nombre: string;
  descripcion: string;
  productos: ProductoSeed[];
};

// ── Catalog: 8 categories, ~38 products ─────────────────────────────────────
export const CATALOGO: CategoriaSeed[] = [
  {
    nombre: "Escritura",
    descripcion: "Bolígrafos, lápices, marcadores y todo para escribir con estilo.",
    productos: [
      {
        nombre: "Bolígrafo BIC Cristal Azul (caja x12)",
        descripcion: "Clásico bolígrafo de tinta azul, escritura suave y duradera.",
        precio: "85.00",
        comparePrice: "110.00",
        sku: "ESC-BIC-AZ-12",
        stock: 120,
        marca: "BIC",
        destacado: true,
      },
      {
        nombre: "Lápiz Mongol No. 2 (caja x12)",
        descripcion: "Lápices de grafito HB ideales para examen y dibujo.",
        precio: "65.00",
        sku: "ESC-MON-2-12",
        stock: 80,
        marca: "Mongol",
      },
      {
        nombre: "Marcador permanente Sharpie negro",
        descripcion: "Punta fina, tinta permanente de secado rápido sobre casi cualquier superficie.",
        precio: "38.00",
        sku: "ESC-SHR-NG-01",
        stock: 60,
        marca: "Sharpie",
      },
      {
        nombre: "Set de resaltadores Stabilo Boss (x6)",
        descripcion: "Seis colores pastel fluorescentes, tinta de larga duración.",
        precio: "175.00",
        comparePrice: "210.00",
        sku: "ESC-STB-BOSS-6",
        stock: 25,
        marca: "Stabilo",
        destacado: true,
      },
      {
        nombre: "Pluma fuente Pilot Metropolitan",
        descripcion: "Pluma fuente de cuerpo metálico, punta media, incluye cartucho.",
        precio: "620.00",
        sku: "ESC-PIL-MET-01",
        stock: 8,
        marca: "Pilot",
      },
      {
        nombre: "Portaminas Pentel 0.5mm",
        descripcion: "Portaminas profesional con goma y clip metálico.",
        precio: "95.00",
        sku: "ESC-PTL-05-01",
        stock: 0,
        marca: "Pentel",
      },
    ],
  },
  {
    nombre: "Cuadernos",
    descripcion: "Cuadernos, libretas y blocs para cada materia.",
    productos: [
      {
        nombre: "Cuaderno universitario rayado 100 hojas",
        descripcion: "Cuaderno cosido tamaño carta, rayado, tapa dura resistente.",
        precio: "72.00",
        sku: "CUA-UNI-100-RAY",
        stock: 200,
        marca: "Norma",
        destacado: true,
      },
      {
        nombre: "Cuaderno cuadriculado 5mm 80 hojas",
        descripcion: "Ideal para matemáticas y dibujo técnico, cuadrícula de 5mm.",
        precio: "68.00",
        sku: "CUA-CUA-80-5MM",
        stock: 150,
        marca: "Norma",
      },
      {
        nombre: "Libreta de bolsillo Moleskine punteada",
        descripcion: "Libreta tapa dura, papel marfil punteado, banda elástica.",
        precio: "385.00",
        comparePrice: "450.00",
        sku: "CUA-MOL-PUNT-01",
        stock: 18,
        marca: "Moleskine",
      },
      {
        nombre: "Bloc de notas adhesivas Post-it (paquete x5)",
        descripcion: "Cinco blocs de notas adhesivas en colores surtidos, 76x76mm.",
        precio: "98.00",
        sku: "CUA-PST-IT-5",
        stock: 40,
        marca: "Post-it",
      },
      {
        nombre: "Agenda 2026 semana vista",
        descripcion: "Agenda anual tapa dura, planificador semanal, marcador de cinta.",
        precio: "245.00",
        sku: "CUA-AGN-2026-01",
        stock: 12,
        marca: "Norma",
      },
      {
        nombre: "Cuaderno profesional empastado 200 hojas",
        descripcion: "Cuaderno empastado de gran capacidad, hojas rayadas finas.",
        precio: "135.00",
        sku: "CUA-PRO-200-EMP",
        stock: 3,
        marca: "Scribe",
      },
    ],
  },
  {
    nombre: "Arte",
    descripcion: "Pinturas, pinceles, lienzos y materiales para crear.",
    productos: [
      {
        nombre: "Colores de madera Prismacolor (x24)",
        descripcion: "Estuche de 24 lápices de color de pigmento intenso y suave aplicación.",
        precio: "420.00",
        comparePrice: "495.00",
        sku: "ART-PRC-24-01",
        stock: 30,
        marca: "Prismacolor",
        destacado: true,
      },
      {
        nombre: "Set de acuarelas Pelikan 12 colores",
        descripcion: "Pastillas de acuarela con pincel incluido, colores vivos y lavables.",
        precio: "165.00",
        sku: "ART-PLK-12-AC",
        stock: 22,
        marca: "Pelikan",
      },
      {
        nombre: "Block de dibujo profesional A3 (50 hojas)",
        descripcion: "Papel de 180 g/m² para lápiz, carboncillo y técnica seca.",
        precio: "210.00",
        sku: "ART-BLK-A3-50",
        stock: 15,
        marca: "Canson",
      },
      {
        nombre: "Juego de pinceles para acrílico (x10)",
        descripcion: "Diez pinceles de cerda sintética en variedad de puntas y tamaños.",
        precio: "180.00",
        sku: "ART-PNC-10-AC",
        stock: 0,
        marca: "Royal",
      },
      {
        nombre: "Témpera escolar lavable 250ml (x6)",
        descripcion: "Seis frascos de témpera lavable en colores primarios y secundarios.",
        precio: "155.00",
        sku: "ART-TMP-250-6",
        stock: 35,
        marca: "Politec",
      },
      {
        nombre: "Lienzo entelado 30x40cm",
        descripcion: "Bastidor de madera con tela 100% algodón imprimada, listo para pintar.",
        precio: "125.00",
        sku: "ART-LNZ-3040-01",
        stock: 9,
        marca: "Fredrix",
      },
    ],
  },
  {
    nombre: "Mochilas",
    descripcion: "Mochilas, loncheras y estuches para la escuela y la oficina.",
    productos: [
      {
        nombre: "Mochila escolar reforzada 18\"",
        descripcion: "Mochila ergonómica con compartimento acolchado para laptop.",
        precio: "850.00",
        comparePrice: "990.00",
        sku: "MOC-ESC-18-01",
        stock: 16,
        marca: "Totto",
        destacado: true,
      },
      {
        nombre: "Mochila con ruedas Jansport",
        descripcion: "Mochila rodante con asa telescópica, ideal para cargas pesadas.",
        precio: "1850.00",
        sku: "MOC-JSP-RUE-01",
        stock: 5,
        marca: "Jansport",
      },
      {
        nombre: "Estuche tres cierres",
        descripcion: "Cartuchera de tres compartimentos, tela resistente al agua.",
        precio: "165.00",
        sku: "MOC-EST-3C-01",
        stock: 45,
        marca: "Totto",
      },
      {
        nombre: "Lonchera térmica infantil",
        descripcion: "Lonchera con aislamiento térmico y forro lavable.",
        precio: "320.00",
        sku: "MOC-LON-TER-01",
        stock: 0,
        marca: "Totto",
      },
      {
        nombre: "Mochila ejecutiva antirrobo",
        descripcion: "Mochila para oficina con puerto USB y cierre oculto.",
        precio: "1450.00",
        comparePrice: "1690.00",
        sku: "MOC-EJE-ANT-01",
        stock: 7,
        marca: "Xtech",
      },
    ],
  },
  {
    nombre: "Oficina",
    descripcion: "Organización, archivo y suministros para la oficina.",
    productos: [
      {
        nombre: "Engrapadora metálica de escritorio",
        descripcion: "Engrapadora de servicio pesado para hasta 25 hojas, incluye grapas.",
        precio: "215.00",
        sku: "OFI-ENG-MET-01",
        stock: 28,
        marca: "Swingline",
      },
      {
        nombre: "Caja de grapas estándar 26/6 (x5000)",
        descripcion: "Grapas galvanizadas estándar, caja de 5000 unidades.",
        precio: "32.00",
        sku: "OFI-GRP-266-5K",
        stock: 90,
        marca: "Swingline",
      },
      {
        nombre: "Folder manila tamaño carta (x25)",
        descripcion: "Paquete de 25 folders de cartulina manila, pestaña reforzada.",
        precio: "78.00",
        sku: "OFI-FLD-MAN-25",
        stock: 110,
        marca: "Pendaflex",
      },
      {
        nombre: "Cinta adhesiva transparente (x6 rollos)",
        descripcion: "Seis rollos de cinta transparente 18mm x 30m.",
        precio: "92.00",
        sku: "OFI-CNT-TRA-6",
        stock: 50,
        marca: "Scotch",
      },
      {
        nombre: "Calculadora científica Casio fx-991",
        descripcion: "Calculadora científica con 552 funciones, pantalla de dos líneas.",
        precio: "560.00",
        comparePrice: "640.00",
        sku: "OFI-CAS-991-01",
        stock: 14,
        marca: "Casio",
        destacado: true,
      },
      {
        nombre: "Perforadora de dos huecos",
        descripcion: "Perforadora metálica con guía ajustable, capacidad 20 hojas.",
        precio: "185.00",
        sku: "OFI-PER-2H-01",
        stock: 2,
        marca: "Rapid",
      },
      {
        nombre: "Tijeras de oficina 8\"",
        descripcion: "Tijeras de acero inoxidable con mango ergonómico.",
        precio: "58.00",
        sku: "OFI-TIJ-8-01",
        stock: 0,
        marca: "Maped",
      },
    ],
  },
  {
    nombre: "Tecnología",
    descripcion: "Accesorios y dispositivos para estudiar y trabajar.",
    productos: [
      {
        nombre: "Memoria USB 64GB",
        descripcion: "Memoria flash USB 3.2 de alta velocidad, carcasa metálica.",
        precio: "285.00",
        sku: "TEC-USB-64-01",
        stock: 40,
        marca: "Kingston",
        destacado: true,
      },
      {
        nombre: "Audífonos diadema con micrófono",
        descripcion: "Audífonos estéreo con micrófono ajustable, ideales para clases en línea.",
        precio: "395.00",
        comparePrice: "470.00",
        sku: "TEC-AUD-MIC-01",
        stock: 20,
        marca: "Logitech",
      },
      {
        nombre: "Mouse inalámbrico óptico",
        descripcion: "Mouse inalámbrico de 2.4GHz, diseño ambidiestro, receptor nano.",
        precio: "240.00",
        sku: "TEC-MOU-INA-01",
        stock: 33,
        marca: "Logitech",
      },
      {
        nombre: "Calculadora gráfica Texas TI-84",
        descripcion: "Calculadora gráfica programable para cálculo y estadística avanzada.",
        precio: "2450.00",
        sku: "TEC-TI84-GRA-01",
        stock: 4,
        marca: "Texas Instruments",
      },
      {
        nombre: "Lámpara LED de escritorio recargable",
        descripcion: "Lámpara con tres niveles de brillo y batería recargable por USB.",
        precio: "410.00",
        sku: "TEC-LMP-LED-01",
        stock: 0,
        marca: "Xtech",
      },
      {
        nombre: "Cable USB-C a USB-C 1m",
        descripcion: "Cable de carga y datos USB-C reforzado, hasta 60W.",
        precio: "120.00",
        sku: "TEC-CAB-CC-1M",
        stock: 75,
        marca: "Anker",
      },
    ],
  },
  {
    nombre: "Manualidades",
    descripcion: "Materiales para proyectos, manualidades y trabajos creativos.",
    productos: [
      {
        nombre: "Pega blanca escolar 250ml",
        descripcion: "Adhesivo blanco no tóxico, lavable, ideal para manualidades.",
        precio: "45.00",
        sku: "MAN-PEG-250-01",
        stock: 65,
        marca: "Resistol",
      },
      {
        nombre: "Silicona líquida transparente 120ml",
        descripcion: "Pegamento de silicona líquida de alta adherencia y secado rápido.",
        precio: "38.00",
        sku: "MAN-SIL-120-01",
        stock: 3,
        marca: "Pritt",
      },
      {
        nombre: "Cartulina de colores tamaño carta (x50)",
        descripcion: "Paquete de 50 cartulinas en diez colores surtidos.",
        precio: "110.00",
        sku: "MAN-CRT-COL-50",
        stock: 30,
        marca: "Politec",
      },
      {
        nombre: "Foami escarchado A4 (x10 láminas)",
        descripcion: "Diez láminas de foami con escarcha en colores variados.",
        precio: "95.00",
        comparePrice: "120.00",
        sku: "MAN-FOA-ESC-10",
        stock: 0,
        marca: "Politec",
      },
      {
        nombre: "Set de plastilina 12 colores",
        descripcion: "Plastilina suave no tóxica, doce barras de colores brillantes.",
        precio: "72.00",
        sku: "MAN-PLA-12-01",
        stock: 48,
        marca: "Play-Doh",
      },
    ],
  },
  {
    nombre: "Geometría",
    descripcion: "Instrumentos de medición y dibujo técnico.",
    productos: [
      {
        nombre: "Juego de geometría escolar (5 piezas)",
        descripcion: "Regla, escuadras, transportador y compás en estuche resistente.",
        precio: "88.00",
        sku: "GEO-JGO-5P-01",
        stock: 52,
        marca: "Maped",
        destacado: true,
      },
      {
        nombre: "Compás de precisión metálico",
        descripcion: "Compás de metal con rueda central de ajuste fino, incluye minas.",
        precio: "135.00",
        sku: "GEO-COM-MET-01",
        stock: 18,
        marca: "Faber-Castell",
      },
      {
        nombre: "Regla metálica 30cm",
        descripcion: "Regla de aluminio anodizado con borde antideslizante.",
        precio: "42.00",
        sku: "GEO-REG-30-01",
        stock: 70,
        marca: "Maped",
      },
      {
        nombre: "Escuadra grande 45° 32cm",
        descripcion: "Escuadra de acrílico transparente con escala impresa.",
        precio: "55.00",
        sku: "GEO-ESC-45-32",
        stock: 1,
        marca: "Maped",
      },
    ],
  },
];
