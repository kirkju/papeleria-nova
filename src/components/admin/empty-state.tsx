import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyStateAdmin — compact empty state for the admin's tables and panels.
 *
 * Server-friendly. Meant to fill the body of a DataTable without rows or a panel
 * without data: subtle icon, title, optional description and a slot for an
 * action (e.g. "Crear el primero" / clearing the filters).
 *
 * Usage:
 *   <EmptyStateAdmin
 *     titulo="Sin pedidos"
 *     descripcion="Aún no hay pedidos que coincidan con estos filtros."
 *   >
 *     <Button variant="outline" asChildLink href="/admin/pedidos">Limpiar filtros</Button>
 *   </EmptyStateAdmin>
 */
export function EmptyStateAdmin({
  titulo,
  descripcion,
  children,
  icono,
  className,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
  icono?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-[var(--radius-lg)] bg-paper-3 text-ink-faint"
      >
        {icono ?? <Inbox className="size-6" strokeWidth={1.75} />}
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-display text-step-1 font-semibold text-ink">
          {titulo}
        </p>
        {descripcion ? (
          <p className="mx-auto max-w-sm text-step-0 text-ink-soft">
            {descripcion}
          </p>
        ) : null}
      </div>
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
