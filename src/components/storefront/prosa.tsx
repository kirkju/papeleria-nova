import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Prosa — Papelería Nova's typographic wrapper for long-form text
 * (legal pages, "nosotros", blog articles) WITHOUT depending on the
 * @tailwindcss/typography plugin. It styles the direct children via Tailwind v4
 * arbitrary selectors, keeping the "stationery boutique" identity:
 *
 *  - h2 / h3 in the display font (Fraunces) with rhythmic margin and adjusted tracking.
 *  - p with a comfortable line height (1.7) and a limited reading width (max-w-prose).
 *  - ul / ol with brand markers (tangerine) and pleasant indentation.
 *  - a with an indigo underline of controlled thickness, visible focus.
 *  - blockquote with a tangerine border and paper-2 background ("highlighter-marked" quote).
 *  - hr as a dashed notebook line, not the default flat bar.
 *  - code / strong with ink weight and color.
 *
 * It is a pure Server Component (no "use client"): it can be used directly in
 * server-rendered pages. The content can be server JSX or already rendered markdown.
 *
 * Usage:
 *   <Prosa>
 *     <h2>Nuestra historia</h2>
 *     <p>Empezamos en un cuartito lleno de cuadernos…</p>
 *     <ul><li>Calidad real</li><li>Precios honestos</li></ul>
 *   </Prosa>
 */
export interface ProsaProps {
  children: React.ReactNode;
  className?: string;
  /** Container tag (article for the blog, div by default). */
  as?: "div" | "article" | "section";
}

export function Prosa({ children, className, as = "div" }: ProsaProps) {
  const Tag = as;
  return (
    <Tag
      className={cn(
        // Base: comfortable reading width, ink color, fluid vertical rhythm.
        "max-w-[68ch] text-step-0 leading-[1.75] text-ink-soft",
        "[&>*+*]:mt-5",

        // --- Section headings (display, full ink color) ---
        "[&_h2]:font-display [&_h2]:text-step-2 [&_h2]:font-semibold [&_h2]:leading-tight [&_h2]:text-ink",
        "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:tracking-[-0.02em] first:[&_h2]:mt-0",
        "[&_h3]:font-display [&_h3]:text-step-1 [&_h3]:font-semibold [&_h3]:leading-snug [&_h3]:text-ink",
        "[&_h3]:mt-9 [&_h3]:mb-3 [&_h3]:tracking-[-0.01em]",

        // --- Paragraphs ---
        "[&_p]:max-w-[68ch] [&_p]:text-pretty",

        // --- Emphasis ---
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_em]:italic",

        // --- Links: indigo underline with offset, visible focus ---
        "[&_a]:font-medium [&_a]:text-primary-600 [&_a]:underline [&_a]:decoration-primary/45 [&_a]:decoration-2 [&_a]:underline-offset-[3px]",
        "[&_a:hover]:decoration-primary [&_a]:transition-[text-decoration-color] [&_a]:duration-200",
        "[&_a]:rounded-[var(--radius-sm)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[var(--color-ring)]",

        // --- Lists with brand markers (tangerine) ---
        "[&_ul]:my-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-1",
        "[&_ul>li]:relative [&_ul>li]:pl-7 [&_ul>li]:text-ink-soft",
        // marker: a small tangerine square dash (not the boring round bullet)
        "[&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:top-[0.62em] [&_ul>li]:before:h-[3px] [&_ul>li]:before:w-3.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-accent [&_ul>li]:before:content-['']",
        "[&_ol]:my-5 [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_ol>li]:pl-1.5 [&_ol>li]:text-ink-soft [&_ol]:marker:font-semibold [&_ol]:marker:text-primary",

        // --- Quote: tangerine "highlighter mark" on raised paper ---
        "[&_blockquote]:my-7 [&_blockquote]:rounded-r-[var(--radius-md)] [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:bg-paper-2 [&_blockquote]:px-5 [&_blockquote]:py-4",
        "[&_blockquote]:text-ink [&_blockquote_p]:font-display [&_blockquote_p]:text-step-1 [&_blockquote_p]:italic [&_blockquote_p]:leading-snug",

        // --- Inline code ---
        "[&_code]:rounded-[var(--radius-sm)] [&_code]:bg-paper-3 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.875em] [&_code]:font-medium [&_code]:text-ink",

        // --- "Dashed notebook line" separator ---
        "[&_hr]:my-10 [&_hr]:h-0 [&_hr]:border-0 [&_hr]:border-t-2 [&_hr]:border-dashed [&_hr]:border-line-strong",

        // --- Images (if embedded): large radius, full width ---
        "[&_img]:my-7 [&_img]:rounded-[var(--radius-lg)]",

        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Decorative doodle per motif. Reuses the visual language of HeroDoodles
 * (hand-drawn strokes, color tokens, slight rotation) but in small pieces to
 * accompany the header of an informational page. Always aria-hidden.
 */
type MotivoEncabezado = "clips" | "lapiz" | "cuaderno" | "carta";

function DoodleMotivo({ motivo }: { motivo: MotivoEncabezado }) {
  const comun = "h-full w-full overflow-visible";

  switch (motivo) {
    case "clips":
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true" className={comun}>
          <path
            d="M40 30c0-12 19-12 19 0v40c0 19-31 19-31 0V42c0-26 43-26 43 0v34"
            fill="none"
            className="stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
            transform="rotate(-14 50 60)"
          />
          <path
            d="M78 44c0-9 14-9 14 0v30c0 14-23 14-23 0V52c0-19 32-19 32 0v26"
            fill="none"
            className="stroke-accent"
            strokeWidth="5"
            strokeLinecap="round"
            transform="rotate(22 88 64)"
          />
        </svg>
      );
    case "lapiz":
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true" className={comun}>
          <g transform="rotate(-32 60 60)">
            <rect
              x="24"
              y="50"
              width="74"
              height="20"
              rx="3"
              className="fill-amber"
            />
            <polygon points="98,50 122,60 98,70" className="fill-paper-3" />
            <polygon points="113,55 122,60 113,65" className="fill-ink" />
            <rect
              x="10"
              y="50"
              width="15"
              height="20"
              rx="3"
              className="fill-rose"
            />
            <line
              x1="38"
              y1="50"
              x2="38"
              y2="70"
              className="stroke-ink/15"
              strokeWidth="2"
            />
          </g>
        </svg>
      );
    case "cuaderno":
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true" className={comun}>
          <g transform="rotate(-6 60 60)">
            <rect
              x="32"
              y="24"
              width="62"
              height="78"
              rx="8"
              className="fill-paper-2 stroke-line-strong"
              strokeWidth="2.5"
            />
            <line
              x1="44"
              y1="28"
              x2="44"
              y2="98"
              className="stroke-rose/50"
              strokeWidth="2"
            />
            {[40, 54, 68, 82].map((y) => (
              <line
                key={y}
                x1="50"
                y1={y}
                x2="86"
                y2={y}
                className="stroke-line"
                strokeWidth="2"
              />
            ))}
            {[30, 46, 62, 78, 94].map((y) => (
              <circle
                key={y}
                cx="32"
                cy={y}
                r="3.5"
                className="fill-paper stroke-line-strong"
                strokeWidth="2"
              />
            ))}
          </g>
        </svg>
      );
    case "carta":
      return (
        <svg viewBox="0 0 120 120" aria-hidden="true" className={comun}>
          <g transform="rotate(4 60 60)">
            <rect
              x="20"
              y="34"
              width="80"
              height="56"
              rx="8"
              className="fill-paper-2 stroke-line-strong"
              strokeWidth="2.5"
            />
            <path
              d="M22 40 60 66 98 40"
              fill="none"
              className="stroke-accent"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="92" cy="40" r="9" className="fill-accent/80" />
          </g>
        </svg>
      );
  }
}

/**
 * EncabezadoPagina — standardized header for informational pages.
 *
 * Renders the page's ONLY <h1> in the large display font, an optional
 * description and a subtle stationery doodle to one side (decorative).
 * Meant for "Nosotros", "Contacto", "FAQ", "Términos", "Privacidad", blog.
 *
 * To highlight a brand word in tangerine inside the title, pass
 * `acento` with the exact fragment to highlight (it is found and wrapped only once).
 *
 * Usage:
 *   <EncabezadoPagina
 *     titulo="Hablemos"
 *     acento="Hablemos"
 *     descripcion="¿Dudas con tu pedido o sugerencias? Te leemos."
 *     motivo="carta"
 *   />
 */
export interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  /** Decorative stationery doodle. If omitted, no illustration is shown. */
  motivo?: MotivoEncabezado;
  /** Exact fragment of the title to paint in tangerine (brand accent). */
  acento?: string;
  className?: string;
}

/** Splits the title to wrap `acento` in tangerine (a single match). */
function tituloConAcento(titulo: string, acento?: string): React.ReactNode {
  if (!acento) return titulo;
  const i = titulo.indexOf(acento);
  if (i === -1) return titulo;
  const antes = titulo.slice(0, i);
  const despues = titulo.slice(i + acento.length);
  return (
    <>
      {antes}
      <span className="text-accent">{acento}</span>
      {despues}
    </>
  );
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  motivo,
  acento,
  className,
}: EncabezadoPaginaProps) {
  return (
    <header
      className={cn(
        "relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="max-w-2xl">
        {/* Small notebook line above the title, like a sewn-on label. */}
        <span
          aria-hidden="true"
          className="mb-4 inline-block h-1.5 w-12 rounded-full bg-accent/70"
        />
        <h1 className="font-display text-step-4 font-semibold leading-[1.02] tracking-[-0.03em] text-ink">
          {tituloConAcento(titulo, acento)}
        </h1>
        {descripcion && (
          <p className="mt-4 max-w-prose text-step-1 leading-relaxed text-ink-soft">
            {descripcion}
          </p>
        )}
      </div>

      {motivo && (
        <div
          aria-hidden="true"
          className="pointer-events-none hidden size-24 shrink-0 self-center sm:block md:size-28"
        >
          <DoodleMotivo motivo={motivo} />
        </div>
      )}
    </header>
  );
}
