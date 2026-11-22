"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { cambiarEstadoPedido } from "@/server/admin/pedidos";
import { ETIQUETA_ESTADO } from "@/lib/validators/admin";
import { StatusBadge, type EstadoPedido } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * Client island to change an order's status from its detail page.
 *
 * It receives the current status and the VALID transitions already computed on
 * the server (`obtenerPedidoAdmin.transicionesValidas`, derived from the
 * `TRANSICIONES_PEDIDO` state machine). It renders one button per transition;
 * pressing one opens a `ConfirmDialog`, and only on confirming does it run
 * `cambiarEstadoPedido`.
 *
 * The hard barrier ("pedido:cambiarEstado") lives in the server action: this UI
 * only offers valid transitions and confirms. Errors (incl. permission, or a
 * transition made invalid by a race) are shown in an accessible banner. On
 * success, it refreshes the route (router.refresh) to reflect the new status and
 * the restored stock.
 *
 * If `transicionesValidas` is empty, the order is terminal: no actions panel
 * is rendered (the caller renders the informational panel).
 */
export function PedidosCambiarEstado({
  pedidoId,
  estadoActual,
  transicionesValidas,
}: {
  pedidoId: string;
  estadoActual: OrderStatus;
  transicionesValidas: OrderStatus[];
}) {
  const router = useRouter();
  const [destino, setDestino] = React.useState<OrderStatus | null>(null);
  const [pendiente, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [exito, setExito] = React.useState<string | null>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  // Move focus to the error banner when it appears (so it is read immediately).
  React.useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  if (transicionesValidas.length === 0) return null;

  const cancelar = () => {
    if (!pendiente) setDestino(null);
  };

  const confirmar = () => {
    if (!destino) return;
    setError(null);
    setExito(null);
    const objetivo = destino;
    startTransition(async () => {
      const resultado = await cambiarEstadoPedido(pedidoId, objetivo);
      if (resultado.ok) {
        setDestino(null);
        setExito(
          resultado.restock
            ? `Pedido marcado como ${ETIQUETA_ESTADO[
                resultado.estado
              ].toLowerCase()}. Se restauró el stock de los productos.`
            : `Pedido marcado como ${ETIQUETA_ESTADO[
                resultado.estado
              ].toLowerCase()}.`,
        );
        router.refresh();
      } else {
        setDestino(null);
        setError(resultado.error);
      }
    });
  };

  const esCancelacion = destino === "CANCELADO";

  return (
    <div className="flex flex-col gap-4">
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-rose/40 bg-rose-50 px-4 py-3 text-step--1 text-rose focus:outline-none"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0"
            strokeWidth={2}
          />
          <p>{error}</p>
        </div>
      ) : null}

      {exito ? (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-mint/50 bg-mint-50 px-4 py-3 text-step--1 text-ink"
        >
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-4.5 shrink-0 text-mint"
            strokeWidth={2}
          />
          <p>{exito}</p>
        </div>
      ) : null}

      <p className="text-step--1 text-ink-soft">
        Estado actual:{" "}
        <span className="font-medium text-ink">
          {ETIQUETA_ESTADO[estadoActual]}
        </span>
        . Elige el siguiente paso:
      </p>

      <ul role="list" className="flex flex-col gap-2.5">
        {transicionesValidas.map((destinoPosible) => {
          const peligro = destinoPosible === "CANCELADO";
          return (
            <li key={destinoPosible}>
              <button
                type="button"
                onClick={() => {
                  setExito(null);
                  setError(null);
                  setDestino(destinoPosible);
                }}
                disabled={pendiente}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border bg-paper px-4 py-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper-2",
                  "disabled:pointer-events-none disabled:opacity-55",
                  peligro
                    ? "border-rose/30 hover:border-rose/50 hover:bg-rose-50"
                    : "border-line hover:border-line-strong hover:bg-paper-3",
                )}
              >
                <span className="flex items-center gap-2.5">
                  <ArrowRight
                    aria-hidden="true"
                    className={cn(
                      "size-4 shrink-0",
                      peligro ? "text-rose" : "text-ink-faint",
                    )}
                    strokeWidth={2.5}
                  />
                  <span className="text-step-0 font-medium text-ink">
                    Marcar como{" "}
                    {ETIQUETA_ESTADO[destinoPosible].toLowerCase()}
                  </span>
                </span>
                <StatusBadge estado={destinoPosible as EstadoPedido} />
              </button>
            </li>
          );
        })}
      </ul>

      <ConfirmDialog
        abierto={destino !== null}
        titulo={
          esCancelacion
            ? "Cancelar pedido"
            : `Cambiar a ${
                destino ? ETIQUETA_ESTADO[destino].toLowerCase() : ""
              }`
        }
        descripcion={
          esCancelacion ? (
            <span className="flex flex-col gap-1.5">
              <span>
                El pedido pasará a{" "}
                <strong className="font-semibold text-ink">cancelado</strong>.
                Esta acción no se puede deshacer.
              </span>
              <span className="font-medium text-rose">
                Se restaurará el stock de los productos del pedido.
              </span>
            </span>
          ) : (
            <span>
              El pedido pasará de{" "}
              <strong className="font-semibold text-ink">
                {ETIQUETA_ESTADO[estadoActual].toLowerCase()}
              </strong>{" "}
              a{" "}
              <strong className="font-semibold text-ink">
                {destino ? ETIQUETA_ESTADO[destino].toLowerCase() : ""}
              </strong>
              .
            </span>
          )
        }
        confirmarTexto={
          esCancelacion ? "Sí, cancelar pedido" : "Confirmar cambio"
        }
        cancelarTexto="No, volver"
        variantePeligro={esCancelacion}
        pendiente={pendiente}
        onConfirmar={confirmar}
        onCancelar={cancelar}
      />
    </div>
  );
}
