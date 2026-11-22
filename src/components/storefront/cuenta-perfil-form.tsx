"use client";

import * as React from "react";
import { useActionState } from "react";
import { Check, Mail, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { actualizarNombre, type ResultadoCuenta } from "@/server/cuenta";

/**
 * CuentaPerfilForm — editing the profile name (client island).
 *
 * Uses `useActionState` over `actualizarNombre`. The new name shows up
 * instantly in /cuenta (the page reads the DB and the action revalidates), but
 * NOT in the header until the next login (the session uses the name from the JWT).
 * TODO(unstable_update): refresh the session token to avoid the re-login.
 *
 * The EMAIL is read-only: changing the email is out of scope because it
 * requires verifying the new address (TODO(cambio-email)).
 *
 * Usage:
 *   <CuentaPerfilForm nombreActual={perfil.nombre} email={perfil.email} />
 */
type Estado = { resultado: ResultadoCuenta | null };

const ESTADO_INICIAL: Estado = { resultado: null };

export function CuentaPerfilForm({
  nombreActual,
  email,
}: {
  nombreActual: string;
  email: string;
}) {
  const [estado, formAction, pendiente] = useActionState(
    async (_prev: Estado, formData: FormData): Promise<Estado> => {
      const resultado = await actualizarNombre(formData);
      return { resultado };
    },
    ESTADO_INICIAL,
  );

  const error =
    estado.resultado && !estado.resultado.ok ? estado.resultado.error : null;
  const exito = estado.resultado?.ok === true;

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <Input
        name="nombre"
        label="Nombre"
        defaultValue={nombreActual}
        autoComplete="name"
        required
        minLength={2}
        maxLength={80}
        error={error ?? undefined}
        hint={
          error
            ? undefined
            : "Es el nombre que verás en tus pedidos y direcciones."
        }
      />

      {/* Read-only email (changing the email is out of scope). */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="cuenta-email"
          className="text-[0.875rem] font-medium text-ink-soft"
        >
          Correo electrónico
        </label>
        <div className="relative flex items-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 flex text-ink-faint"
          >
            <Mail className="size-4.5" strokeWidth={1.75} />
          </span>
          <input
            id="cuenta-email"
            type="email"
            value={email}
            readOnly
            aria-readonly="true"
            tabIndex={-1}
            className="h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper-3/60 pl-10 pr-10 text-step-0 text-ink-soft"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3.5 flex text-ink-faint"
          >
            <Lock className="size-4" strokeWidth={1.75} />
          </span>
        </div>
        <p className="text-[0.8rem] text-ink-faint">
          Para cambiar tu correo,{" "}
          <a
            href="/contacto"
            className="font-medium text-primary-600 underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            contáctanos
          </a>
          .
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" loading={pendiente}>
          Guardar cambios
        </Button>
        {exito && (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium text-mint"
          >
            <Check aria-hidden="true" className="size-4.5" strokeWidth={2.5} />
            Datos actualizados
          </span>
        )}
      </div>
    </form>
  );
}
