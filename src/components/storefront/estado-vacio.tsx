import * as React from "react";

/**
 * EstadoVacio — message shown when a search/filter returns no products.
 *
 * Server Component (no interactivity of its own). Inline stationery SVG
 * illustration (a pencil shrugging next to scattered paper clips) with a
 * friendly tone. `children` allows injecting actions (e.g. a
 * "Ver todo el catálogo" button or clearing the filters).
 *
 * Usage:
 *   <EstadoVacio
 *     titulo="No encontramos útiles…"
 *     descripcion="Prueba con otra búsqueda o quita algunos filtros."
 *   >
 *     <Button asChildLink href="/catalogo">Ver todo el catálogo</Button>
 *   </EstadoVacio>
 */
export function EstadoVacio({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-paper-2 px-6 py-14 text-center">
      <IlustracionVacio className="h-36 w-auto" />
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-step-2 font-semibold text-ink">
          {titulo}
        </h2>
        <p className="mx-auto max-w-md text-step-0 text-ink-soft">
          {descripcion}
        </p>
      </div>
      {children && (
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * "Shrugging" pencil: a pencil body with a friendly face and two paper
 * clips at the sides as raised "arms". Decorative (aria-hidden).
 */
function IlustracionVacio({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      role="img"
      aria-label="Un lápiz desconcertado entre clips: no hay resultados"
      className={className}
    >
      {/* Soft background blot */}
      <ellipse cx="110" cy="150" rx="80" ry="12" className="fill-ink/5" />

      {/* Left clip (raised arm) */}
      <path
        d="M44 96c0-12 18-12 18 0v22c0 16-28 16-28 0v-16"
        fill="none"
        className="stroke-ink-soft"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Right clip */}
      <path
        d="M176 96c0-12 18-12 18 0v22c0 16-28 16-28 0v-16"
        fill="none"
        className="stroke-ink-soft"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Pencil body, slightly tilted */}
      <g transform="rotate(-6 110 96)">
        <rect
          x="78"
          y="40"
          width="64"
          height="100"
          rx="10"
          className="fill-amber"
        />
        {/* band */}
        <rect x="78" y="64" width="64" height="8" className="fill-rose/70" />
        {/* tip */}
        <polygon
          points="78,40 110,8 142,40"
          className="fill-paper-3 stroke-line-strong"
          strokeWidth="2"
        />
        <polygon points="98,24 110,8 122,24" className="fill-ink" />
        {/* eraser */}
        <rect
          x="78"
          y="140"
          width="64"
          height="16"
          rx="6"
          className="fill-rose"
        />
        {/* puzzled face */}
        <circle cx="98" cy="92" r="4" className="fill-ink" />
        <circle cx="122" cy="92" r="4" className="fill-ink" />
        <path
          d="M96 112 q14 -10 28 2"
          fill="none"
          className="stroke-ink"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>

      {/* Floating question mark */}
      <text
        x="166"
        y="52"
        className="fill-primary font-display"
        fontSize="34"
        fontWeight="700"
      >
        ?
      </text>
    </svg>
  );
}
