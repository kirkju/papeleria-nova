"use client";

import * as React from "react";
import { Banknote, CreditCard, Check, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * SeccionPago — "Método de pago" block of the checkout form.
 *
 * It does NOT handle submit or action: a section INSIDE the <form> assembled by
 * the page. It emits a single `name` that travels to the server: metodoPago
 * ("contra_entrega" | "tarjeta_demo"). "Pago contra entrega" is the default.
 *
 * Choosing "Tarjeta (DEMO)" shows card fields WITHOUT a `name` attribute
 * (number, expiry, CVV): they NEVER travel to the server. They carry a very
 * visible notice (role="note") that this is demo mode. The format validation
 * (grouping of the number, MM/AA, numeric CVV) is purely client-side.
 *
 * Names emitted to the FormData: metodoPago (radio). The card fields have NO
 * name by design.
 *
 * Usage:
 *   <SeccionPago />
 */
type MetodoPago = "contra_entrega" | "tarjeta_demo";

export function SeccionPago() {
  const [metodo, setMetodo] = React.useState<MetodoPago>("contra_entrega");

  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-primary-50 text-primary"
        >
          <CreditCard className="size-5" strokeWidth={2} />
        </span>
        <span className="font-display text-step-1 font-semibold text-ink">
          Método de pago
        </span>
      </legend>

      <div
        role="radiogroup"
        aria-label="Elige un método de pago"
        className="flex flex-col gap-3"
      >
        <MetodoCard
          valor="contra_entrega"
          seleccionado={metodo === "contra_entrega"}
          onSeleccionar={() => setMetodo("contra_entrega")}
          icono={<Banknote className="size-5" strokeWidth={2} />}
          titulo="Pago contra entrega"
          descripcion="Paga en efectivo al recibir tus útiles."
        />

        <MetodoCard
          valor="tarjeta_demo"
          seleccionado={metodo === "tarjeta_demo"}
          onSeleccionar={() => setMetodo("tarjeta_demo")}
          icono={<CreditCard className="size-5" strokeWidth={2} />}
          titulo="Tarjeta"
          descripcion="Pago con tarjeta de crédito o débito."
          badge={<Badge variant="stock-bajo">Demo</Badge>}
        />
      </div>

      {/* DEMO card fields: only in card mode. No name attribute. */}
      {metodo === "tarjeta_demo" && <CamposTarjetaDemo />}
    </fieldset>
  );
}

/**
 * MetodoCard — accessible radio card for a payment method. The real radio
 * (name="metodoPago") is hidden but accessible; the <label> is the target.
 */
function MetodoCard({
  valor,
  seleccionado,
  onSeleccionar,
  icono,
  titulo,
  descripcion,
  badge,
}: {
  valor: MetodoPago;
  seleccionado: boolean;
  onSeleccionar: () => void;
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  badge?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer items-center gap-3.5 rounded-[var(--radius-lg)] border bg-paper-2 p-4",
        "transition-[border-color,box-shadow,background-color] duration-200 ease-out",
        "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-paper",
        seleccionado
          ? "border-primary shadow-card ring-1 ring-primary/30"
          : "border-line hover:border-line-strong hover:bg-paper-3/40",
      )}
    >
      <input
        type="radio"
        name="metodoPago"
        value={valor}
        checked={seleccionado}
        onChange={onSeleccionar}
        className="sr-only"
      />

      {/* Drawn radio indicator. */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          seleccionado
            ? "border-primary bg-primary text-on-primary"
            : "border-line-strong bg-paper",
        )}
      >
        {seleccionado && <Check className="size-3" strokeWidth={4} />}
      </span>

      {/* Method icon */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors",
          seleccionado
            ? "bg-primary-50 text-primary"
            : "bg-paper-3 text-ink-soft",
        )}
      >
        {icono}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-ink">{titulo}</span>
          {badge}
        </span>
        <span className="mt-0.5 block text-[0.9rem] text-ink-soft">
          {descripcion}
        </span>
      </span>
    </label>
  );
}

/**
 * CamposTarjetaDemo — visual card fields. By design NONE of them carries a
 * `name`, so they never travel in the FormData. Format validation is 100%
 * client-side (grouping, MM/AA, CVV); purely cosmetic.
 */
function CamposTarjetaDemo() {
  const [numero, setNumero] = React.useState("");
  const [vencimiento, setVencimiento] = React.useState("");
  const [cvv, setCvv] = React.useState("");

  const numeroId = React.useId();
  const vencId = React.useId();
  const cvvId = React.useId();

  // Number: digits in groups of 4 (max 16 digits -> "1234 5678 9012 3456").
  function alCambiarNumero(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 16);
    const grupos = digitos.match(/.{1,4}/g);
    setNumero(grupos ? grupos.join(" ") : "");
  }

  // Expiry: MM/AA (4 digits -> "MM/AA").
  function alCambiarVencimiento(e: React.ChangeEvent<HTMLInputElement>) {
    const digitos = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formateado =
      digitos.length > 2 ? `${digitos.slice(0, 2)}/${digitos.slice(2)}` : digitos;
    setVencimiento(formateado);
  }

  // CVV: 3-4 digits.
  function alCambiarCvv(e: React.ChangeEvent<HTMLInputElement>) {
    setCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-amber/40 bg-amber-50/60 p-4 sm:p-5">
      {/* VERY visible notice: this is not a real charge. */}
      <p
        role="note"
        className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-amber-50 px-3.5 py-3 text-[0.85rem] font-medium text-ink"
      >
        <ShieldAlert
          aria-hidden="true"
          className="mt-px size-5 shrink-0 text-amber"
          strokeWidth={2}
        />
        <span>
          <strong className="font-semibold">Modo demostración:</strong> no
          ingreses una tarjeta real. Estos datos no se envían ni se guardan.
        </span>
      </p>

      {/* Card number (no name). */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={numeroId}
          className="text-[0.875rem] font-medium text-ink-soft"
        >
          Número de tarjeta
        </label>
        <input
          id={numeroId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={numero}
          onChange={alCambiarNumero}
          placeholder="1234 5678 9012 3456"
          className={clasesCampoTarjeta}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Expiry (no name). */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={vencId}
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            Vencimiento (MM/AA)
          </label>
          <input
            id={vencId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={vencimiento}
            onChange={alCambiarVencimiento}
            placeholder="MM/AA"
            className={clasesCampoTarjeta}
          />
        </div>

        {/* CVV (no name). */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor={cvvId}
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            CVV
          </label>
          <input
            id={cvvId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={cvv}
            onChange={alCambiarCvv}
            placeholder="123"
            className={clasesCampoTarjeta}
          />
        </div>
      </div>
    </div>
  );
}

/** Shared style of the card inputs (consistent with Input). */
const clasesCampoTarjeta = cn(
  "h-11 w-full rounded-[var(--radius-md)] border border-line bg-paper px-3.5 text-step-0 text-ink",
  "placeholder:text-ink-faint tabular-nums",
  "transition-[border-color,box-shadow] duration-200 ease-out",
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
);
