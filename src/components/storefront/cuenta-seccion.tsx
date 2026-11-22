import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CuentaSeccion — section card of the account area (Server Component).
 *
 * Standardizes the "premium stationery" block that wraps each part of the
 * profile page (profile data, password, addresses): raised surface with a
 * large radius, header with an icon in a chip and an optional description, and
 * an action slot to the right of the title (e.g. a "Ver pedidos" link).
 *
 * The title uses the display font. The icon is decorative (aria-hidden); the
 * section's accessible name is the <h2>. Composable: the content goes in as
 * children.
 *
 * Usage:
 *   <CuentaSeccion titulo="Tus datos" icono={<UserRound />} descripcion="…">
 *     <CuentaPerfilForm … />
 *   </CuentaSeccion>
 */
export function CuentaSeccion({
  titulo,
  descripcion,
  icono,
  accion,
  children,
  className,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  icono: React.ReactNode;
  accion?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--radius-lg)] border border-line bg-paper-2 p-5 shadow-card sm:p-6",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600 [&_svg]:size-5"
          >
            {icono}
          </span>
          <div className="flex flex-col gap-0.5">
            <h2 className="font-display text-step-1 font-semibold leading-tight text-ink">
              {titulo}
            </h2>
            {descripcion && (
              <p className="text-[0.9rem] text-ink-soft">{descripcion}</p>
            )}
          </div>
        </div>
        {accion && <div className="shrink-0">{accion}</div>}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
