/**
 * Papelería Nova blog content.
 *
 * SINGLE SOURCE OF TRUTH: the /blog and /blog/[slug] pages consume this
 * file directly (there is no CMS yet). Each article is a structure of typed
 * blocks so that rendering is faithful and free of the dangers of arbitrary
 * HTML. Dates are fixed ISO strings (not Date.now) so that the build is
 * deterministic and the sitemap does not change on every deploy.
 *
 * TODO (future): migrate to a CMS or MDX when the volume justifies it.
 */

export type BloqueContenido =
  | { tipo: "p"; texto: string }
  | { tipo: "h2"; texto: string }
  | { tipo: "lista"; items: string[] };

export type ArticuloBlog = {
  slug: string;
  titulo: string;
  /** Description for SEO (ideally 140-160 characters). */
  descripcion: string;
  /** Publication date in ISO 8601 (fixed in code). */
  fecha: string;
  autor: string;
  categoria: string;
  /** Absolute path of the cover (an existing image in /public). */
  portada: string;
  /** Descriptive alt text for the cover image. */
  portadaAlt: string;
  contenido: BloqueContenido[];
};

export const ARTICULOS_BLOG: ArticuloBlog[] = [
  {
    slug: "lista-utiles-regreso-a-clases",
    titulo: "Lista de útiles para el regreso a clases sin estrés",
    descripcion:
      "Todo lo que necesitas para el regreso a clases en Honduras: cuadernos, lápices, mochilas y más. Lista práctica por nivel escolar con precios en Lempiras.",
    fecha: "2026-01-15T08:00:00.000Z",
    autor: "Equipo Papelería Nova",
    categoria: "Regreso a clases",
    portada: "/categorias/cuadernos.svg",
    portadaAlt: "Cuadernos y útiles escolares listos para el regreso a clases",
    contenido: [
      {
        tipo: "p",
        texto:
          "El regreso a clases en Honduras llega con una mezcla de emoción y, seamos honestos, de agobio por la lista de útiles. Entre el presupuesto ajustado, los artículos que se agotan rápido y la incertidumbre de qué pide cada maestro, es fácil terminar comprando de más o de menos. Aquí te dejamos una guía práctica para llegar al primer día del ciclo escolar con todo listo y sin sobresaltos.",
      },
      {
        tipo: "h2",
        texto: "Lo que nunca falta: la base de cualquier mochila",
      },
      {
        tipo: "p",
        texto:
          "Independientemente del grado, hay artículos que siempre son necesarios. Son los que conviene comprar primero, antes de que se agoten en las tiendas: cuadernos (al menos cuatro de distintos tamaños), lápices de grafito del No. 2, bolígrafos azul y negro, regla de 30 cm, tijeras de punta redondeada y una buena engrapadora de escritorio.",
      },
      {
        tipo: "lista",
        items: [
          "Cuadernos universitarios o de composición (según el nivel)",
          "Lápices No. 2 con borrador (mínimo 6 unidades)",
          "Bolígrafos azul y negro BIC o similares",
          "Regla de 30 cm con escala doble",
          "Tijeras escolares de acero inoxidable",
          "Engrapadora con caja de grapas incluida",
          "Resaltadores en colores surtidos",
          "Pegamento en barra y silicón líquido",
        ],
      },
      {
        tipo: "h2",
        texto: "Por nivel: ajusta la lista sin derrochar",
      },
      {
        tipo: "p",
        texto:
          "En prebásica y primaria el énfasis está en los materiales de arte: crayones de cera, pinturas lavables, plastilina y papel de construcción. Para el nivel medio suman las calculadoras científicas, los compases y los instrumentos de geometría. En el nivel universitario el cuaderno anillado de 200 páginas y los resaltadores de cuatro colores son prácticamente obligatorios.",
      },
      {
        tipo: "h2",
        texto: "Mochilas: no sacrifiques la espalda por el precio",
      },
      {
        tipo: "p",
        texto:
          "Una mochila barata que se rompe al tercer mes sale más cara que una resistente. Busca respaldo acolchado, tirantes regulables y compartimentos bien pensados. El peso de la mochila llena no debería superar el 10-15 % del peso corporal del niño. En Papelería Nova tenemos opciones desde L 350 hasta L 950 para todos los bolsillos.",
      },
      {
        tipo: "h2",
        texto: "Consejos para estirar el presupuesto",
      },
      {
        tipo: "lista",
        items: [
          "Compra con anticipación: en enero los precios son más estables.",
          "Revisa los útiles del año anterior antes de comprar nuevos.",
          "Elige marcas de relación calidad-precio comprobada (Norma, BIC, Staedtler).",
          "Compra paquetes o lotes cuando los artículos se usan en cantidad (lápices, hojas).",
          "Aprovecha los envíos gratis de Papelería Nova en pedidos arriba de L 1,500.",
        ],
      },
      {
        tipo: "p",
        texto:
          "Con un plan claro y la lista en mano, el regreso a clases se convierte en una aventura, no en un dolor de cabeza. ¿No encuentras algo en tu lista? Escríbenos, que con gusto te ayudamos a encontrar la mejor opción dentro de tu presupuesto.",
      },
    ],
  },
  {
    slug: "como-elegir-el-cuaderno-perfecto",
    titulo: "Cómo elegir el cuaderno perfecto según tu forma de estudiar",
    descripcion:
      "Rayado, cuadriculado o liso, espiral o cosido: elige el cuaderno ideal según tu método de estudio y nivel educativo. Guía práctica con tips reales.",
    fecha: "2026-02-03T08:00:00.000Z",
    autor: "Equipo Papelería Nova",
    categoria: "Cuadernos",
    portada: "/categorias/cuadernos.svg",
    portadaAlt: "Cuadernos abiertos mostrando distintos tipos de pauta",
    contenido: [
      {
        tipo: "p",
        texto:
          "El cuaderno parece la decisión más sencilla del año escolar, pero en realidad define cómo organizas tus notas, si entiendes tus apuntes al repasar y hasta si terminas con dolor de muñeca. Elegir bien no es trivial. Aquí desglosamos las variables que importan.",
      },
      {
        tipo: "h2",
        texto: "El tipo de pauta importa más de lo que crees",
      },
      {
        tipo: "p",
        texto:
          "La pauta rayada (líneas horizontales) es la más común y la mejor para texto corrido, composición y apuntes rápidos. La cuadriculada brilla en matemáticas, física, contabilidad y diagramas, porque las cuadrículas funcionan como guía automática para tablas y gráficos. La pauta punteada (dot grid) es la favorita de quienes hacen bullet journaling y toman notas con esquemas mixtos: da orden sin imponer estructura rígida. El papel liso queda para el arte y la caligrafía.",
      },
      {
        tipo: "lista",
        items: [
          "Rayado: ideal para texto, historia, idiomas y materias de lectura.",
          "Cuadriculado: matemáticas, física, química, contabilidad.",
          "Punteado: bullet journal, mapas mentales, mezcla de texto y dibujo.",
          "Liso: arte, caligrafía, bocetos y dibujo técnico libre.",
        ],
      },
      {
        tipo: "h2",
        texto: "Espiral o cosido: una cuestión de durabilidad",
      },
      {
        tipo: "p",
        texto:
          "Los cuadernos de espiral permiten abrir la página 180° sin dobleces y son perfectos para quien escribe mucho a mano. El inconveniente es que el espiral se daña si se meten en una mochila apretada. Los cuadernos cosidos (como los clásicos de composición) son más resistentes al maltrato cotidiano, no tienen espiral que se enganche con la ropa y mantienen mejor la encuadernación a largo plazo. Para secundaria y universidad donde el cuaderno dura el año entero, el cosido suele ganar.",
      },
      {
        tipo: "h2",
        texto: "El gramaje del papel: ¿importa?",
      },
      {
        tipo: "p",
        texto:
          "Sí, mucho. Un papel de 60 g/m² (el estándar económico) sangra con rotuladores y resaltadores. Un papel de 75-90 g/m² aguanta rotuladores, gel y plumas sin fantasmas al otro lado. Si usas resaltadores de forma frecuente o prefieres el bolígrafo de gel, busca cuadernos con papel de al menos 75 g/m². En Papelería Nova etiquetamos el gramaje en la ficha de cada producto para que nunca tengas que adivinar.",
      },
      {
        tipo: "h2",
        texto: "Tamaño: carta, oficio o universitario",
      },
      {
        tipo: "p",
        texto:
          "El tamaño carta (21,6 × 28 cm) es el más versátil y combina con carpetas estándar. El tamaño universitario (19 × 24 cm) es más compacto y cabe mejor en mochilas pequeñas. El oficio (21,6 × 33 cm) es útil en contabilidad y derecho donde se necesita espacio para columnas y firmas. Para primaria, el de composición pequeño (16 × 21 cm) es el formato ideal.",
      },
      {
        tipo: "h2",
        texto: "El detalle que pocos consideran: la portada",
      },
      {
        tipo: "p",
        texto:
          "Una portada resistente (cartón duro o plastificada) protege el cuaderno de la humedad y el maltrato. Si tu cuaderno vive al fondo de una mochila llena, este detalle marca la diferencia entre un cuaderno que llega limpio a diciembre y uno que termina deshojado y con páginas sueltas en agosto.",
      },
    ],
  },
  {
    slug: "organizar-escritorio-poco-presupuesto",
    titulo: "5 ideas para organizar tu escritorio con poco presupuesto",
    descripcion:
      "Organiza tu espacio de estudio u oficina sin gastar de más. Ideas prácticas con materiales de papelería accesibles en Honduras para un escritorio funcional y bonito.",
    fecha: "2026-03-10T08:00:00.000Z",
    autor: "Equipo Papelería Nova",
    categoria: "Organización",
    portada: "/categorias/oficina.svg",
    portadaAlt: "Escritorio organizado con artículos de papelería y oficina",
    contenido: [
      {
        tipo: "p",
        texto:
          "Un escritorio desordenado no es solo un problema estético: afecta la concentración, aumenta el tiempo que tardas en encontrar cosas y genera más estrés del que imaginas. La buena noticia es que ordenar tu espacio no requiere muebles caros ni un rediseño de habitación. Con artículos de papelería que probablemente ya tienes o que cuestan poco, puedes transformar la superficie de trabajo.",
      },
      {
        tipo: "h2",
        texto: "1. Separa las zonas de trabajo y las zonas de archivo",
      },
      {
        tipo: "p",
        texto:
          "La zona de trabajo activo (lo que usas hoy) debe estar a la vista y al alcance. La zona de archivo (lo que usarás esta semana pero no ahora mismo) va en gavetas o cajas. Con solo un organizador de escritorio de tres compartimentos ya estás separando el bolígrafo del mes pasado del que necesitas ahora. Esta separación es el paso más rentable: cuesta nada y ahorra minutos todos los días.",
      },
      {
        tipo: "h2",
        texto: "2. Carpetas de argolla para cada materia o proyecto",
      },
      {
        tipo: "p",
        texto:
          "Una carpeta de argolla por materia o proyecto te da la arquitectura de organización más sólida con la menor inversión. El truco está en usar separadores con colores diferentes y etiquetar cada sección con rótulos escritos a mano o etiquetas adhesivas. Al final del día, vas archivando cada hoja en su lugar y el escritorio queda limpio de papeles sueltos.",
      },
      {
        tipo: "lista",
        items: [
          "Asigna un color de carpeta a cada asignatura o cliente.",
          "Usa separadores de plástico resistentes (duran más que los de cartón).",
          "Etiqueta las carpetas con nombres claros, no solo colores.",
          "Revisa y descarta papeles obsoletos cada mes.",
        ],
      },
      {
        tipo: "h2",
        texto: "3. Porta-lápices reciclado: tarro + etiqueta",
      },
      {
        tipo: "p",
        texto:
          "Un frasco de vidrio o una lata de leche limpia y seca es el porta-lápices más económico del mercado. Ponle una etiqueta de papel tipo kraft (se venden por paquetes en Papelería Nova) y escribe en él el tipo de utensilio que guarda: lápices, marcadores, tijeras. Agrupa por función, no por color, y verás cómo reduces el tiempo que tardas en encontrar lo que buscas.",
      },
      {
        tipo: "h2",
        texto: "4. Notas adhesivas con sistema de colores",
      },
      {
        tipo: "p",
        texto:
          "Las notas adhesivas (Post-it o equivalentes) son la herramienta de productividad más subestimada. Define un código de colores simple: amarillo para tareas urgentes del día, verde para pendientes de la semana, azul para ideas y anotaciones que no quieres perder. Pégalas en el borde del monitor o en una zona visible del escritorio. El sistema funciona porque es visual y no requiere ninguna app.",
      },
      {
        tipo: "h2",
        texto: "5. Bandeja de entrada y salida para el flujo de papeles",
      },
      {
        tipo: "p",
        texto:
          "El peor enemigo del escritorio ordenado es la pila de papeles sin clasificar. Una bandeja de dos niveles (entrada y salida) resuelve el problema de forma elegante: todo lo que llega va a entrada; todo lo que ya procesaste y necesita llegar a otro lado va a salida. Esta sola herramienta, que cuesta menos de L 150 en nuestra tienda, puede eliminar el 80 % del desorden de tu mesa de trabajo.",
      },
      {
        tipo: "p",
        texto:
          "Organizar el escritorio no es un lujo ni un proyecto de fin de semana: son cinco decisiones pequeñas que se hacen una sola vez y te ahorran tiempo todos los días. ¿Necesitas alguno de estos artículos? Los encontrarás en nuestro catálogo de oficina.",
      },
    ],
  },
  {
    slug: "guia-mochilas-tamano-espalda-durabilidad",
    titulo: "Guía de mochilas: tamaño, espalda y durabilidad",
    descripcion:
      "Todo lo que debes saber antes de comprar una mochila escolar o universitaria en Honduras: capacidad en litros, soporte lumbar, materiales y precios en Lempiras.",
    fecha: "2026-04-07T08:00:00.000Z",
    autor: "Equipo Papelería Nova",
    categoria: "Mochilas",
    portada: "/categorias/mochilas.svg",
    portadaAlt: "Mochilas escolares de distintos tamaños y colores",
    contenido: [
      {
        tipo: "p",
        texto:
          "La mochila es el artículo escolar que más impacto tiene en el bienestar físico del estudiante, y también el que más se compra por impulso. Una decisión basada solo en el color o en el precio puede terminar en dolor de espalda crónico o en una mochila que se rompe antes del primer trimestre. Esta guía te da las claves para elegir bien.",
      },
      {
        tipo: "h2",
        texto: "El tamaño importa: guíate por litros, no por cm",
      },
      {
        tipo: "p",
        texto:
          "Las medidas en centímetros dicen poco. Lo que importa es la capacidad en litros, que te indica cuánto puedes cargar sin deformar la mochila. Para primaria (6-12 años) lo ideal es entre 12 y 18 litros. Para secundaria, entre 20 y 28 litros. Para universidad, donde cargas laptop, apuntes y lunchera, una mochila de 30-40 litros es más conveniente. Una mochila demasiado grande queda floja y el peso se desplaza mal; demasiado pequeña y terminas cargando cosas en la mano.",
      },
      {
        tipo: "lista",
        items: [
          "Prebásica / Primaria baja: 10-14 litros (solo lo esencial).",
          "Primaria alta: 14-20 litros.",
          "Secundaria: 20-28 litros.",
          "Universidad / trabajo: 28-40 litros.",
        ],
      },
      {
        tipo: "h2",
        texto: "La espalda: el factor más importante y más ignorado",
      },
      {
        tipo: "p",
        texto:
          "Una mochila mal diseñada puede generar problemas posturales en niños en crecimiento. Busca respaldo acolchado (no un simple panel de tela plano), tirantes con relleno de espuma en el tramo del hombro y, en mochilas de más de 20 litros, una tira pectoral que distribuye el peso del pecho. El sistema de soporte lumbar con ventilación es ideal para el trópico hondureño: evita el calor y el sudor en la espalda durante el trayecto.",
      },
      {
        tipo: "h2",
        texto: "Materiales: resistencia vs. peso",
      },
      {
        tipo: "p",
        texto:
          "El poliéster de 600D es el estándar accesible: dura con cuidado normal y se consigue en mochilas de L 350 a L 600. El nylon balístico (1680D) es más resistente al desgarre y a la abrasión, pero pesa más y su precio ronda los L 700-950. Para el día a día escolar, el poliéster 600D es suficiente. Para mochileros o uso intensivo, vale la pena invertir en el nylon. Revisa también los cierres: los de metal duran más que los de plástico en el uso diario.",
      },
      {
        tipo: "h2",
        texto: "Compartimentos: más no siempre es mejor",
      },
      {
        tipo: "p",
        texto:
          "La tentación de elegir la mochila con más bolsillos es real, pero demasiados compartimentos fragmentan el espacio y dificultan encontrar las cosas. Lo mínimo útil: un compartimento principal grande (para cuadernos y libros), uno intermedio o frontal (para útiles, lonchera o tablet) y uno pequeño exterior (para el celular, bus pass y llaves). Si la mochila tiene compartimento acolchado para laptop y tu hijo no lleva laptop, ese espacio queda desperdiciado.",
      },
      {
        tipo: "h2",
        texto: "Cuánto pagar: la trampa del precio bajo",
      },
      {
        tipo: "p",
        texto:
          "Una mochila de L 150 que dura cuatro meses cuesta el doble anualmente que una de L 500 que dura dos años. Haz el cálculo. El rango L 400-700 ofrece la mejor relación calidad-precio para uso escolar cotidiano. Más de L 900 tiene sentido para mochilas técnicas (senderismo, viaje, laptop profesional) pero es difícil justificarlo para la escuela salvo que el modelo incluya garantía del fabricante.",
      },
      {
        tipo: "p",
        texto:
          "Con esta guía ya tienes los criterios para elegir la mochila correcta sin dejarte llevar solo por el diseño. Revisa nuestro catálogo de mochilas con filtro por precio y capacidad, y si tienes dudas, escríbenos por el formulario de contacto.",
      },
    ],
  },
];

/**
 * Looks up an article by slug. Returns undefined if it does not exist.
 * Use it together with Next.js notFound() in the article pages.
 */
export function obtenerArticulo(slug: string): ArticuloBlog | undefined {
  return ARTICULOS_BLOG.find((a) => a.slug === slug);
}

/**
 * Related articles: the first `limite` articles that are NOT the given slug.
 * Used in the "Sigue leyendo" section at the end of each article.
 */
export function articulosRelacionados(
  slugActual: string,
  limite = 2,
): ArticuloBlog[] {
  return ARTICULOS_BLOG.filter((a) => a.slug !== slugActual).slice(0, limite);
}
