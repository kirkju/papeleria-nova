"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * ConfirmDialog — accessible, generic modal confirmation dialog.
 *
 * Reuses the CartDrawer's accessibility pattern: role="dialog",
 * aria-modal, aria-labelledby/aria-describedby, closing with Escape / overlay /
 * Cancelar, basic focus trap (Tab cycles inside), initial focus on the cancel
 * button (the safe option) and focus returned to the trigger on close. It locks
 * the background scroll while it is open. Subtle animation; none with
 * prefers-reduced-motion.
 *
 * It is CONTROLLED: the parent handles `abierto` and reacts to onConfirmar/onCancelar.
 * Use it for destructive or sensitive actions: "change an order's status",
 * "deactivate a product", "change a role". `variantePeligro` tints the confirm
 * button and the icon red (rose/accent). `pendiente` shows a spinner on
 * confirm and blocks the actions (use it while the server action runs).
 *
 * Usage:
 *   const [abierto, setAbierto] = useState(false);
 *   const [pend, startTransition] = useTransition();
 *   <ConfirmDialog
 *     abierto={abierto}
 *     titulo="Desactivar producto"
 *     descripcion="Dejará de mostrarse en la tienda. Podrás reactivarlo luego."
 *     confirmarTexto="Desactivar"
 *     variantePeligro
 *     pendiente={pend}
 *     onCancelar={() => setAbierto(false)}
 *     onConfirmar={() => startTransition(async () => { await accion(); setAbierto(false); })}
 *   />
 */
export function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  confirmarTexto,
  cancelarTexto = "Cancelar",
  variantePeligro = false,
  pendiente = false,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  descripcion: React.ReactNode;
  confirmarTexto: string;
  cancelarTexto?: string;
  variantePeligro?: boolean;
  pendiente?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  const reducir = useReducedMotion();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const cancelarRef = React.useRef<HTMLButtonElement>(null);
  const tituloId = React.useId();
  const descId = React.useId();

  // Escape (if not pending) + background scroll lock + focus returned
  // to the trigger on close (same pattern as the CartDrawer).
  React.useEffect(() => {
    if (!abierto) return;
    const disparador = document.activeElement as HTMLElement | null;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pendiente) onCancelar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (disparador && document.contains(disparador)) disparador.focus();
    };
  }, [abierto, pendiente, onCancelar]);

  // Initial focus on Cancelar (the safe option) + basic focus trap.
  React.useEffect(() => {
    if (!abierto) return;
    const panel = panelRef.current;
    if (!panel) return;

    cancelarRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      const activo = document.activeElement;

      if (e.shiftKey && activo === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && activo === ultimo) {
        e.preventDefault();
        primero.focus();
      } else if (!panel.contains(activo)) {
        e.preventDefault();
        primero.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [abierto]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Presentational overlay: closing by keyboard is covered by Escape and the
              Cancelar button, so the accessible name is not duplicated. */}
          <div
            role="presentation"
            onClick={() => !pendiente && onCancelar()}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-describedby={descId}
            initial={reducir ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reducir ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reducir ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-[var(--radius-lg)] border border-line bg-paper p-6 shadow-lift focus:outline-none"
          >
            <div className="flex gap-4">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-11 shrink-0 place-items-center rounded-[var(--radius-md)]",
                  variantePeligro
                    ? "bg-rose-50 text-rose"
                    : "bg-primary-50 text-primary-600",
                )}
              >
                <AlertTriangle className="size-5.5" strokeWidth={2} />
              </span>
              <div className="flex flex-col gap-1.5">
                <h2
                  id={tituloId}
                  className="font-display text-step-1 font-semibold leading-tight text-ink"
                >
                  {titulo}
                </h2>
                <div id={descId} className="text-step-0 text-ink-soft">
                  {descripcion}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button
                ref={cancelarRef}
                type="button"
                variant="outline"
                onClick={onCancelar}
                disabled={pendiente}
                className="sm:min-w-28"
              >
                {cancelarTexto}
              </Button>
              <Button
                type="button"
                variant={variantePeligro ? "accent" : "primary"}
                onClick={onConfirmar}
                loading={pendiente}
                className={cn(
                  "sm:min-w-28",
                  variantePeligro &&
                    "bg-rose text-on-primary hover:bg-rose/90",
                )}
              >
                {confirmarTexto}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
