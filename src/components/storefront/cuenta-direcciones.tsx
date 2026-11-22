"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EstadoVacio } from "@/components/storefront/estado-vacio";
import {
  eliminarDireccion,
  marcarDireccionPredeterminada,
  type ResultadoCuenta,
} from "@/server/cuenta";
import { cn } from "@/lib/utils";

/**
 * CuentaDirecciones — list of the user's addresses (client island).
 *
 * Receives the addresses already serialized by the page (which reads them with
 * `obtenerDireccionesUsuario`). It allows "Hacer predeterminada" and "Eliminar"
 * (the latter after confirming with `ConfirmDialog`). Both actions run in a
 * `useTransition` and, on success, `router.refresh()` re-reads the list from the
 * server (the action already revalidates /cuenta). Every mutation is scoped by
 * the session userId on the server.
 *
 * Creating an address is NOT done here: addresses are saved when placing an
 * order. The empty state links to the catalog.
 *
 * Usage:
 *   <CuentaDirecciones direcciones={direcciones} />
 */
export type DireccionVista = {
  id: string;
  linea1: string;
  linea2: string | null;
  ciudad: string;
  departamento: string;
  telefono: string;
  esPredeterminada: boolean;
};

export function CuentaDirecciones({
  direcciones,
}: {
  direcciones: DireccionVista[];
}) {
  const router = useRouter();
  const [pendiente, startTransition] = React.useTransition();
  // id of the address with an action in progress (for per-card feedback).
  const [enCurso, setEnCurso] = React.useState<string | null>(null);
  // Address that is a candidate for deletion (opens the ConfirmDialog).
  const [aEliminar, setAEliminar] = React.useState<DireccionVista | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const ejecutar = React.useCallback(
    (id: string, accion: () => Promise<ResultadoCuenta>) => {
      setError(null);
      setEnCurso(id);
      startTransition(async () => {
        const res = await accion();
        if (res.ok) {
          router.refresh();
        } else {
          setError(res.error);
        }
        setEnCurso(null);
      });
    },
    [router],
  );

  if (direcciones.length === 0) {
    return (
      <EstadoVacio
        titulo="Aún no tienes direcciones guardadas"
        descripcion="Las direcciones se guardan al hacer un pedido. Cuando completes una compra, podrás reutilizar y gestionar tus direcciones desde aquí."
      >
        <Button asChildLink href="/catalogo" variant="accent">
          Explorar el catálogo
        </Button>
      </EstadoVacio>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-rose/30 bg-rose-50 px-3.5 py-3 text-[0.9rem] font-medium text-rose"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0"
            strokeWidth={2}
          />
          {error}
        </p>
      )}

      <ul role="list" className="grid gap-4 sm:grid-cols-2">
        {direcciones.map((dir) => {
          const ocupada = pendiente && enCurso === dir.id;
          return (
            <li
              key={dir.id}
              className={cn(
                "relative flex flex-col gap-3 rounded-[var(--radius-lg)] border bg-paper-2 p-5 shadow-card transition-opacity",
                dir.esPredeterminada
                  ? "border-primary/40 ring-1 ring-primary/15"
                  : "border-line",
                ocupada && "opacity-60",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary-50 text-primary-600"
                >
                  <MapPin className="size-5" strokeWidth={1.85} />
                </span>
                {dir.esPredeterminada && (
                  <Badge variant="oferta" className="gap-1">
                    <Star
                      aria-hidden="true"
                      className="size-3"
                      strokeWidth={2.5}
                      fill="currentColor"
                    />
                    Predeterminada
                  </Badge>
                )}
              </div>

              <address className="not-italic text-[0.9rem] leading-relaxed text-ink-soft">
                <span className="font-medium text-ink">{dir.linea1}</span>
                {dir.linea2 && (
                  <>
                    <br />
                    {dir.linea2}
                  </>
                )}
                <br />
                {dir.ciudad}, {dir.departamento}
                <br />
                <span className="tabular-nums">Tel. {dir.telefono}</span>
              </address>

              <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                {!dir.esPredeterminada && (
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    loading={ocupada}
                    disabled={pendiente}
                    onClick={() =>
                      ejecutar(dir.id, () =>
                        marcarDireccionPredeterminada(dir.id),
                      )
                    }
                  >
                    <Star aria-hidden="true" className="size-4" strokeWidth={2} />
                    Hacer predeterminada
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pendiente}
                  onClick={() => {
                    setError(null);
                    setAEliminar(dir);
                  }}
                  className="text-rose hover:bg-rose-50 hover:text-rose"
                >
                  <Trash2 aria-hidden="true" className="size-4" strokeWidth={2} />
                  Eliminar
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-[0.85rem] text-ink-faint">
        ¿Necesitas una dirección nueva? Se guarda automáticamente al{" "}
        <a
          href="/catalogo"
          className="font-medium text-primary-600 underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        >
          hacer un pedido
        </a>
        .
      </p>

      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar dirección"
        descripcion={
          aEliminar ? (
            <>
              Vas a eliminar{" "}
              <span className="font-medium text-ink">{aEliminar.linea1}</span> (
              {aEliminar.ciudad}). Esta acción no se puede deshacer.
              {aEliminar.esPredeterminada && (
                <>
                  {" "}
                  Si quedan otras direcciones, una pasará a ser tu predeterminada.
                </>
              )}
            </>
          ) : (
            ""
          )
        }
        confirmarTexto="Eliminar"
        variantePeligro
        pendiente={pendiente && enCurso === aEliminar?.id}
        onCancelar={() => {
          if (!pendiente) setAEliminar(null);
        }}
        onConfirmar={() => {
          if (!aEliminar) return;
          const objetivo = aEliminar;
          setError(null);
          setEnCurso(objetivo.id);
          startTransition(async () => {
            const res = await eliminarDireccion(objetivo.id);
            if (res.ok) {
              setAEliminar(null);
              router.refresh();
            } else {
              setError(res.error);
            }
            setEnCurso(null);
          });
        }}
      />
    </div>
  );
}
