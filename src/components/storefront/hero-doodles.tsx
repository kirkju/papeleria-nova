/**
 * HeroDoodles — composition of hand-drawn stationery motifs (our own inline
 * SVG): notebook, ruler, paper clip, pencil and a watercolor stroke. Pure
 * Server Component (no JS). Decorative: aria-hidden.
 *
 * Strokes use currentColor / tokens for consistency with the light/dark theme.
 */
export function HeroDoodles({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 360"
      role="img"
      aria-label="Ilustración de útiles de papelería: cuaderno, regla, lápiz y clip"
      className={className}
    >
      {/* Background watercolor blot (soft tangerine) */}
      <path
        d="M60 120c-10-40 30-70 70-66s60 8 96 30 50 64 30 96-72 36-110 28-70-12-86-44 0-44 0-44Z"
        className="fill-accent/12"
      />

      {/* Notebook (paper-2 with lines), slightly rotated */}
      <g transform="rotate(-7 170 190)">
        <rect
          x="92"
          y="118"
          width="156"
          height="196"
          rx="14"
          className="fill-paper-2 stroke-line-strong"
          strokeWidth="2.5"
        />
        {/* margin line */}
        <line
          x1="118"
          y1="124"
          x2="118"
          y2="308"
          className="stroke-rose/50"
          strokeWidth="2"
        />
        {/* ruled lines */}
        {[150, 176, 202, 228, 254, 280].map((y) => (
          <line
            key={y}
            x1="128"
            y1={y}
            x2="232"
            y2={y}
            className="stroke-line"
            strokeWidth="2"
          />
        ))}
        {/* spiral */}
        {[124, 150, 176, 202, 228, 254, 280].map((y) => (
          <circle
            key={y}
            cx="92"
            cy={y}
            r="4.5"
            className="fill-paper stroke-line-strong"
            strokeWidth="2"
          />
        ))}
      </g>

      {/* Ruler (indigo), diagonal */}
      <g transform="rotate(34 260 110)">
        <rect
          x="196"
          y="92"
          width="150"
          height="34"
          rx="6"
          className="fill-primary"
        />
        {[210, 226, 242, 258, 274, 290, 306, 322].map((x, i) => (
          <line
            key={x}
            x1={x}
            y1="92"
            x2={x}
            y2={i % 2 === 0 ? "108" : "102"}
            className="stroke-on-primary/70"
            strokeWidth="2"
          />
        ))}
      </g>

      {/* Pencil (graphite yellow) */}
      <g transform="rotate(-28 110 270)">
        <rect
          x="60"
          y="262"
          width="120"
          height="18"
          rx="3"
          className="fill-amber"
        />
        <polygon points="180,262 204,271 180,280" className="fill-paper-3" />
        <polygon points="195,266 204,271 195,276" className="fill-ink" />
        <rect x="48" y="262" width="14" height="18" rx="3" className="fill-rose" />
      </g>

      {/* Paper clip (metallic = ink-soft) */}
      <path
        d="M286 232c0-14 22-14 22 0v36c0 22-36 22-36 0v-30c0-30 50-30 50 0v30"
        fill="none"
        className="stroke-ink-soft"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
