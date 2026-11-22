"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  EyeOff,
  MoreVertical,
  PenSquare,
  RotateCcw,
} from "lucide-react";
import {
  desactivarProducto,
  reactivarProducto,
} from "@/server/admin/productos";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * ProductosAccionesFila — per-row actions menu of the products table.
 *
 * Actions available according to permissions (the PAGE decides which `puede*` to
 * pass; the hard barrier lives in each server action):
 *  - Edit (puedeEditar => producto:editar): link to /admin/productos/<id>/editar.
 *  - Deactivate / Reactivate (puedeDesactivar => producto:desactivar): SOFT
 *    delete with a ConfirmDialog. An inactive product can be reactivated from here.
 *  - View in store (only if the product is active): /producto/<slug> in a new
 *    tab.
 *
 * It is an accessible dropdown menu (button with aria-expanded + list of actions)
 * that closes with Escape, an outside click or on choosing an option. The
 * ConfirmDialog manages its own focus and scroll lock.
 */
export function ProductosAccionesFila({
  id,
  nombre,
  slug,
  activo,
  puedeEditar,
  puedeDesactivar,
}: {
  id: string;
  nombre: string;
  slug: string;
  activo: boolean;
  puedeEditar: boolean;
  puedeDesactivar: boolean;
}) {
  const [abierto, setAbierto] = React.useState(false);
  const [confirmando, setConfirmando] = React.useState(false);
  const [pendiente, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const contenedorRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!abierto) return;
    const onClickFuera = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) setAbierto(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onKey);
    };
  }, [abierto]);

  function confirmarCambioActivo() {
    setError(null);
    startTransition(async () => {
      const resultado = activo
        ? await desactivarProducto(id)
        : await reactivarProducto(id);
      if (resultado.ok) {
        setConfirmando(false);
      } else {
        setError(resultado.error);
      }
    });
  }

  // If no admin action is available, there is only "Ver en tienda" (if
  // active). To avoid an empty menu, we show the direct link.
  const sinMenu = !puedeEditar && !puedeDesactivar;

  if (sinMenu) {
    return activo ? (
      <Link
        href={`/producto/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Ver ${nombre} en la tienda (abre en pestaña nueva)`}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-1 text-step--1 font-medium text-primary-600 transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ExternalLink aria-hidden="true" className="size-4" strokeWidth={2} />
        Ver
      </Link>
    ) : (
      <span className="text-ink-faint">—</span>
    );
  }

  return (
    <div ref={contenedorRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={`Acciones de ${nombre}`}
        className="grid size-9 place-items-center rounded-[var(--radius-md)] text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MoreVertical aria-hidden="true" className="size-4.5" strokeWidth={2} />
      </button>

      {abierto ? (
        <div
          role="menu"
          aria-label={`Acciones de ${nombre}`}
          className="absolute right-0 z-20 mt-1.5 w-52 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper py-1 shadow-lift"
        >
          {puedeEditar ? (
            <Link
              href={`/admin/productos/${id}/editar`}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-step--1 text-ink transition-colors hover:bg-paper-3 focus-visible:bg-paper-3 focus-visible:outline-none"
            >
              <PenSquare
                aria-hidden="true"
                className="size-4 text-ink-soft"
                strokeWidth={2}
              />
              Editar producto
            </Link>
          ) : null}

          {activo ? (
            <Link
              href={`/producto/${slug}`}
              role="menuitem"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-2.5 px-3.5 py-2 text-step--1 text-ink transition-colors hover:bg-paper-3 focus-visible:bg-paper-3 focus-visible:outline-none"
            >
              <ExternalLink
                aria-hidden="true"
                className="size-4 text-ink-soft"
                strokeWidth={2}
              />
              Ver en tienda
            </Link>
          ) : null}

          {puedeDesactivar ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAbierto(false);
                setError(null);
                setConfirmando(true);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-step--1 transition-colors focus-visible:outline-none",
                activo
                  ? "text-rose hover:bg-rose-50 focus-visible:bg-rose-50"
                  : "text-mint hover:bg-mint-50 focus-visible:bg-mint-50",
              )}
            >
              {activo ? (
                <EyeOff aria-hidden="true" className="size-4" strokeWidth={2} />
              ) : (
                <RotateCcw aria-hidden="true" className="size-4" strokeWidth={2} />
              )}
              {activo ? "Desactivar" : "Reactivar"}
            </button>
          ) : null}
        </div>
      ) : null}

      {puedeDesactivar ? (
        <ConfirmDialog
          abierto={confirmando}
          titulo={activo ? "Desactivar producto" : "Reactivar producto"}
          descripcion={
            <>
              {activo ? (
                <>
                  <span className="font-medium text-ink">{nombre}</span> dejará de
                  mostrarse en la tienda. Conserva su histórico y podrás
                  reactivarlo cuando quieras.
                </>
              ) : (
                <>
                  <span className="font-medium text-ink">{nombre}</span> volverá a
                  mostrarse en la tienda (si tiene stock disponible).
                </>
              )}
              {error ? (
                <span className="mt-2 block font-medium text-rose">{error}</span>
              ) : null}
            </>
          }
          confirmarTexto={activo ? "Desactivar" : "Reactivar"}
          variantePeligro={activo}
          pendiente={pendiente}
          onConfirmar={confirmarCambioActivo}
          onCancelar={() => {
            if (!pendiente) {
              setConfirmando(false);
              setError(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}
