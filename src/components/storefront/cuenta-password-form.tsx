"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, AlertCircle, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cambiarPassword, type ResultadoCuenta } from "@/server/cuenta";
import { cn } from "@/lib/utils";

/**
 * CuentaPasswordForm — password change (client island).
 *
 * Asks for the CURRENT password, the NEW one and its confirmation. The
 * requirements meter (min 8 / at least one letter / at least one number) is
 * computed ON THE CLIENT only as a visual guide: it sends NOTHING extra to the
 * server; the real validation (and the comparison of the current one) live in
 * `cambiarPassword`.
 *
 * For security, on a failure the server answers with a GENERIC message; the UI
 * does NOT try to deduce which field failed. On success it shows
 * "Contraseña actualizada" and resets the form: the reset is achieved by
 * remounting the fields via `key` (count of successes), without effects or
 * `setState` in effects.
 *
 * It does not close other sessions (TODO(revocacion), documented at project level).
 *
 * Usage:
 *   <CuentaPasswordForm />
 */
type Estado = {
  resultado: ResultadoCuenta | null;
  /** Count of successful changes: used as the `key` to remount and clear. */
  exitos: number;
};

const ESTADO_INICIAL: Estado = { resultado: null, exitos: 0 };

/** Requirements of the new password (they mirror the registration rules). */
const REQUISITOS: { id: string; etiqueta: string; cumple: (v: string) => boolean }[] =
  [
    { id: "len", etiqueta: "Al menos 8 caracteres", cumple: (v) => v.length >= 8 },
    { id: "letra", etiqueta: "Incluye una letra", cumple: (v) => /[A-Za-z]/.test(v) },
    { id: "num", etiqueta: "Incluye un número", cumple: (v) => /\d/.test(v) },
  ];

export function CuentaPasswordForm() {
  const [estado, formAction, pendiente] = useActionState(
    async (prev: Estado, formData: FormData): Promise<Estado> => {
      const resultado = await cambiarPassword(formData);
      const exitos = resultado.ok ? prev.exitos + 1 : prev.exitos;
      return { resultado, exitos };
    },
    ESTADO_INICIAL,
  );

  const exito = estado.resultado?.ok === true;
  const error =
    estado.resultado && !estado.resultado.ok ? estado.resultado.error : null;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {/* Generic error banner (it does not reveal the field). */}
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

      {/* Success banner. */}
      {exito && (
        <p
          role="status"
          className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-mint/30 bg-mint-50 px-3.5 py-3 text-[0.9rem] font-medium text-mint"
        >
          <ShieldCheck
            aria-hidden="true"
            className="size-4.5 shrink-0"
            strokeWidth={2}
          />
          Contraseña actualizada
        </p>
      )}

      {/* Fields remounted on success via `key`: clears the uncontrolled inputs and the
          meter's local state, with no need for an effect with setState. */}
      <CamposPassword key={estado.exitos} />

      <div>
        <Button type="submit" variant="primary" loading={pendiente}>
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}

/**
 * Form fields. Isolated so that they can be remounted with `key` after a
 * successful change (clean reset). The requirements meter lives here because
 * it depends on the typed value of the new password.
 */
function CamposPassword() {
  const [nueva, setNueva] = React.useState("");

  return (
    <>
      <Input
        name="actual"
        type="password"
        label="Contraseña actual"
        autoComplete="current-password"
        required
      />

      <div className="flex flex-col gap-2">
        <Input
          name="nueva"
          type="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          aria-describedby="requisitos-password"
        />
        {/* Requirements meter: visual guide on the client, sending nothing. */}
        <ul
          id="requisitos-password"
          aria-label="Requisitos de la nueva contraseña"
          className="flex flex-col gap-1 pl-0.5"
        >
          {REQUISITOS.map((req) => {
            const ok = req.cumple(nueva);
            return (
              <li
                key={req.id}
                className={cn(
                  "flex items-center gap-2 text-[0.8rem] transition-colors",
                  ok ? "text-mint" : "text-ink-faint",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    ok
                      ? "border-mint bg-mint text-on-primary"
                      : "border-line-strong",
                  )}
                >
                  {ok && <Check className="size-3" strokeWidth={3} />}
                </span>
                <span>
                  <span className="sr-only">
                    {ok ? "Cumplido: " : "Pendiente: "}
                  </span>
                  {req.etiqueta}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <Input
        name="confirmacion"
        type="password"
        label="Confirmar nueva contraseña"
        autoComplete="new-password"
        required
        minLength={8}
        maxLength={72}
      />
    </>
  );
}
