"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Power,
  PowerOff,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { Role } from "@prisma/client";
import {
  cambiarRolUsuario,
  cambiarActivoUsuario,
} from "@/server/admin/usuarios";
import { ETIQUETA_ROL, ROLES_USUARIO } from "@/lib/validators/usuarios";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { cn } from "@/lib/utils";

/**
 * UsuariosAcciones — client island with the per-row actions of the admin
 * users DataTable: change role (to any of the 3 roles) and activate /
 * deactivate the account.
 *
 * The hard barrier ("usuario:gestionarRol", ADMIN ONLY) lives in each server
 * action; this UI only offers the actions and confirms. The anti-lockout rules
 * (not changing your own role, not deactivating yourself, not demoting/deactivating
 * the last active admin) are RESOLVED by the server, which returns a clear message
 * in Spanish; here we render it as an expected notice, not as a technical failure.
 *
 * Behavior:
 *  - `esActual`: the user is the one of the current session. The actions that the
 *    server would block on oneself (change role, deactivate) are disabled in
 *    the menu with a `title`/`aria` explaining why (defense in depth: the
 *    server is still the barrier; this is just consistent UX).
 *  - Each action opens a `ConfirmDialog`. Changing the role describes the jump and
 *    what it implies; deactivating uses `variantePeligro` and makes clear that the
 *    user's current session stays valid until it expires.
 *  - `useTransition` + `pendiente` for the loading state. On success:
 *    `router.refresh()` and an `aria-live="polite"` message. If `cambiado === false`
 *    (idempotent), a soft "Sin cambios" message. On error: a `role="alert"` banner
 *    with the server's message.
 */

/** Roles available for the change menu, ordered from least to greatest reach. */
const ROLES_DISPONIBLES = ROLES_USUARIO;

/** Description of what the user gains/loses on moving to each role. */
const IMPLICACION_ROL: Record<Role, string> = {
  CLIENTE: "solo podrá comprar y ver sus pedidos; perderá el acceso al panel.",
  VENDEDOR: "tendrá acceso al panel de ventas, pedidos e inventario.",
  ADMIN: "tendrá control total del panel, incluidos usuarios y ajustes.",
};

type DialogoRol = { tipo: "rol"; rol: Role };
type DialogoActivo = { tipo: "activo"; activar: boolean };
type Dialogo = DialogoRol | DialogoActivo | null;

export function UsuariosAcciones({
  id,
  nombre,
  rol,
  activo,
  esActual,
}: {
  id: string;
  nombre: string;
  rol: Role;
  activo: boolean;
  esActual: boolean;
}) {
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [dialogo, setDialogo] = React.useState<Dialogo>(null);
  const [pendiente, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [aviso, setAviso] = React.useState<string | null>(null);
  const contenedorRef = React.useRef<HTMLDivElement>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);

  // Closing the menu on an outside click or Escape.
  React.useEffect(() => {
    if (!menuAbierto) return;
    const onClickFuera = (e: MouseEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) {
        setMenuAbierto(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAbierto(false);
    };
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuAbierto]);

  // Move focus to the error banner as soon as it appears.
  React.useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  function abrirDialogo(d: Dialogo) {
    setError(null);
    setMenuAbierto(false);
    setDialogo(d);
  }

  function cancelarDialogo() {
    if (!pendiente) setDialogo(null);
  }

  function confirmar() {
    if (!dialogo) return;
    setError(null);
    setAviso(null);
    const actual = dialogo;
    startTransition(async () => {
      const resultado =
        actual.tipo === "rol"
          ? await cambiarRolUsuario(id, actual.rol)
          : await cambiarActivoUsuario(id, actual.activar);

      if (resultado.ok) {
        setDialogo(null);
        if (resultado.cambiado) {
          setAviso(
            actual.tipo === "rol"
              ? `${nombre} ahora es ${ETIQUETA_ROL[actual.rol]}.`
              : actual.activar
                ? `La cuenta de ${nombre} fue reactivada.`
                : `La cuenta de ${nombre} fue desactivada.`,
          );
          router.refresh();
        } else {
          // Idempotent: the user was already in that state.
          setAviso("Sin cambios: ya estaba así.");
        }
      } else {
        setDialogo(null);
        setError(resultado.error);
      }
    });
  }

  const dialogoRolActivo = dialogo?.tipo === "rol" ? dialogo.rol : null;
  const dialogoActivar = dialogo?.tipo === "activo" ? dialogo.activar : null;

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Accessible notices: success / no changes (polite) */}
      {aviso ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-center gap-1.5 text-step--1 text-mint"
        >
          <CheckCircle2 aria-hidden="true" className="size-4" strokeWidth={2} />
          <span className="text-ink-soft">{aviso}</span>
        </p>
      ) : null}

      {/* Error (includes the expected anti-lockout notices) */}
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="flex max-w-xs items-start gap-1.5 rounded-[var(--radius-sm)] border border-rose/40 bg-rose-50 px-2.5 py-1.5 text-left text-step--1 text-rose focus:outline-none"
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0"
            strokeWidth={2}
          />
          <p>{error}</p>
        </div>
      ) : null}

      <div ref={contenedorRef} className="relative inline-block text-left">
        <button
          type="button"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-label={`Acciones de ${nombre}`}
          className="grid size-9 place-items-center rounded-[var(--radius-md)] text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreVertical aria-hidden="true" className="size-4.5" strokeWidth={2} />
        </button>

        {menuAbierto ? (
          <div
            role="menu"
            aria-label={`Acciones de ${nombre}`}
            className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-[var(--radius-md)] border border-line bg-paper py-1 shadow-lift"
          >
            {/* ── Change role ── */}
            <p
              className="flex items-center gap-2 px-3.5 pt-1.5 pb-1 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint"
              id={`menu-rol-${id}`}
            >
              <UserCog aria-hidden="true" className="size-3.5" strokeWidth={2} />
              Cambiar rol
            </p>
            <ul role="group" aria-labelledby={`menu-rol-${id}`}>
              {ROLES_DISPONIBLES.map((r) => {
                const esRolActual = r === rol;
                // The server prevents changing one's OWN role: we disable it.
                const deshabilitado = esRolActual || esActual;
                return (
                  <li key={r}>
                    <button
                      type="button"
                      role="menuitemradio"
                      aria-checked={esRolActual}
                      disabled={deshabilitado}
                      title={
                        esActual
                          ? "No puedes cambiar tu propio rol."
                          : esRolActual
                            ? "Rol actual."
                            : undefined
                      }
                      onClick={() => abrirDialogo({ tipo: "rol", rol: r })}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 px-3.5 py-2 text-left text-step--1 transition-colors focus-visible:outline-none",
                        deshabilitado
                          ? "cursor-not-allowed text-ink-faint"
                          : "text-ink hover:bg-paper-3 focus-visible:bg-paper-3",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <ShieldCheck
                          aria-hidden="true"
                          className={cn(
                            "size-4",
                            esRolActual ? "text-primary-600" : "text-ink-faint",
                          )}
                          strokeWidth={2}
                        />
                        {ETIQUETA_ROL[r]}
                      </span>
                      {esRolActual ? (
                        <span className="text-[0.7rem] font-medium text-ink-faint">
                          Actual
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div role="separator" className="my-1 border-t border-line" />

            {/* ── Activate / Deactivate ── */}
            <button
              type="button"
              role="menuitem"
              disabled={esActual && activo}
              title={
                esActual && activo
                  ? "No puedes desactivar tu propia cuenta."
                  : undefined
              }
              onClick={() =>
                abrirDialogo({ tipo: "activo", activar: !activo })
              }
              className={cn(
                "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-step--1 transition-colors focus-visible:outline-none",
                esActual && activo
                  ? "cursor-not-allowed text-ink-faint"
                  : activo
                    ? "text-rose hover:bg-rose-50 focus-visible:bg-rose-50"
                    : "text-mint hover:bg-mint-50 focus-visible:bg-mint-50",
              )}
            >
              {activo ? (
                <PowerOff aria-hidden="true" className="size-4" strokeWidth={2} />
              ) : (
                <Power aria-hidden="true" className="size-4" strokeWidth={2} />
              )}
              {activo ? "Desactivar cuenta" : "Activar cuenta"}
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Dialog: change role ── */}
      <ConfirmDialog
        abierto={dialogoRolActivo !== null}
        titulo="Cambiar rol"
        descripcion={
          dialogoRolActivo ? (
            <span className="flex flex-col gap-1.5">
              <span>
                <span className="font-medium text-ink">{nombre}</span> pasará de{" "}
                <strong className="font-semibold text-ink">
                  {ETIQUETA_ROL[rol]}
                </strong>{" "}
                a{" "}
                <strong className="font-semibold text-ink">
                  {ETIQUETA_ROL[dialogoRolActivo]}
                </strong>
                .
              </span>
              <span className="text-step--1 text-ink-soft">
                Como {ETIQUETA_ROL[dialogoRolActivo]},{" "}
                {IMPLICACION_ROL[dialogoRolActivo]}
              </span>
            </span>
          ) : (
            ""
          )
        }
        confirmarTexto="Cambiar rol"
        cancelarTexto="Cancelar"
        pendiente={pendiente}
        onConfirmar={confirmar}
        onCancelar={cancelarDialogo}
      />

      {/* ── Dialog: activate / deactivate ── */}
      <ConfirmDialog
        abierto={dialogoActivar !== null}
        titulo={
          dialogoActivar === false ? "Desactivar cuenta" : "Activar cuenta"
        }
        descripcion={
          dialogoActivar === false ? (
            <span className="flex flex-col gap-1.5">
              <span>
                <span className="font-medium text-ink">{nombre}</span> no podrá
                iniciar sesión a partir de ahora.
              </span>
              <span className="text-step--1 text-ink-soft">
                Su sesión actual sigue válida hasta expirar; el acceso se cierra en
                el próximo inicio de sesión. Podrás reactivar la cuenta cuando
                quieras.
              </span>
            </span>
          ) : (
            <span>
              <span className="font-medium text-ink">{nombre}</span> volverá a
              poder iniciar sesión con su rol actual.
            </span>
          )
        }
        confirmarTexto={
          dialogoActivar === false ? "Desactivar" : "Activar"
        }
        cancelarTexto="Cancelar"
        variantePeligro={dialogoActivar === false}
        pendiente={pendiente}
        onConfirmar={confirmar}
        onCancelar={cancelarDialogo}
      />
    </div>
  );
}
