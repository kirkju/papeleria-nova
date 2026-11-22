import Link from "next/link";

/**
 * Footer — footer of the Papelería Nova storefront.
 *
 * Server Component. Brand, columns of informational links, a currency note
 * in Lempiras and a notebook visual detail (red margin line + subtle horizontal
 * rules) that reinforces the stationery identity.
 */
const COLUMNAS: { titulo: string; enlaces: { href: string; label: string }[] }[] =
  [
    {
      titulo: "Tienda",
      enlaces: [
        { href: "/catalogo", label: "Catálogo" },
        { href: "/catalogo?cat=escritura", label: "Escritura" },
        { href: "/catalogo?cat=cuadernos", label: "Cuadernos" },
        { href: "/catalogo?cat=arte", label: "Arte" },
      ],
    },
    {
      titulo: "Información",
      enlaces: [
        { href: "/nosotros", label: "Nosotros" },
        { href: "/contacto", label: "Contacto" },
        { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
      ],
    },
    {
      titulo: "Legal",
      enlaces: [
        { href: "/terminos", label: "Términos y condiciones" },
        { href: "/privacidad", label: "Aviso de privacidad" },
      ],
    },
  ];

export function Footer() {
  const anio = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-line bg-paper-2">
      {/* Notebook-style margin line (decorative) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-6 hidden w-px bg-rose/40 sm:left-10 md:block"
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-12">
        {/* Brand */}
        <div className="flex flex-col gap-3">
          <span className="font-display text-step-2 font-semibold tracking-tight">
            Papelería <span className="text-accent">Nova</span>
          </span>
          <p className="max-w-xs text-[0.9rem] text-ink-soft">
            Útiles escolares y de oficina elegidos con cariño. Boutique de
            papelería premium con alma de cuaderno.
          </p>
          <p className="mt-2 inline-flex w-fit items-center gap-2 rounded-[var(--radius-pill)] border border-line bg-paper px-3 py-1 text-[0.8rem] text-ink-soft">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-mint"
            />
            Precios en Lempiras (L)
          </p>
        </div>

        {/* Link columns */}
        {COLUMNAS.map((col) => (
          <nav key={col.titulo} aria-label={col.titulo}>
            <h2 className="font-display text-step-0 font-semibold text-ink">
              {col.titulo}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {col.enlaces.map((e) => (
                <li key={e.href}>
                  <Link
                    href={e.href}
                    className="rounded-[var(--radius-sm)] text-[0.9rem] text-ink-soft transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-[0.82rem] text-ink-faint sm:flex-row sm:px-6 lg:px-12">
          <p>© {anio} Papelería Nova. Todos los derechos reservados.</p>
          <p>Hecho en Honduras con grafito y café.</p>
        </div>
      </div>
    </footer>
  );
}
