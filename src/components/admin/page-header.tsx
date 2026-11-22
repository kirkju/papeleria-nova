import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader — consistent header for each admin page.
 *
 * Server-friendly (no state or effects). Renders the title (display h1), an
 * optional description and an actions slot on the right (buttons, links).
 * On mobile the actions drop below the text; at sm+ they align to the right.
 *
 * The VISIBLE page title is set by each page with PageHeader; the document's
 * <title> (tab) is resolved by the page's own `metadata` via the layout's
 * template. Do not duplicate them.
 *
 * Usage:
 *   <PageHeader titulo="Pedidos" descripcion="Gestiona y cambia el estado.">
 *     <Button variant="accent">Nuevo</Button>
 *   </PageHeader>
 */
export function PageHeader({
  titulo,
  descripcion,
  children,
  className,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-step-2 font-bold tracking-tight text-ink">
          {titulo}
        </h1>
        {descripcion ? (
          <p className="max-w-prose text-step-0 text-ink-soft">{descripcion}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
