"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FormularioContacto — Papelería Nova's public contact form.
 *
 * It is PUBLIC (it requires no session). The server action is injected THROUGH
 * THE `action` PROP so that this client component is not coupled to
 * @/server/contacto (that module is built independently). The action's contract is:
 *     (formData: FormData) => Promise<ResultadoContacto>
 * where ResultadoContacto = { ok: true } | { ok: false; error: string }.
 *
 * EXACT names of the fields that travel in the FormData (the page consumes them
 * without seeing this file):
 *   - nombre    (text, required)
 *   - email     (email, required)
 *   - asunto    (text, OPTIONAL)
 *   - mensaje   (textarea, required)
 *   - apellido2 (HONEYPOT — it must arrive empty; if it carries a value, it is a bot)
 *
 * Accessible honeypot: the "apellido2" trap field does NOT use display:none (some
 * bots detect and avoid it). It is hidden visually by moving it off-screen
 * and it is removed from the accessibility tree (aria-hidden wrapper +
 * tabIndex -1 + autoComplete off). A human with a screen reader does not
 * find it; a bot that fills in everything triggers it.
 *
 * States:
 *  - error   -> role="alert" banner that receives focus (scroll + focus).
 *  - success -> the form is REPLACED by a thank-you with a paper stamp
 *               and an "Enviar otro mensaje" button that resets the state.
 *  - pending -> button in loading, fields locked.
 *
 * Usage (in the contact page, a server component):
 *   import { enviarMensajeContacto } from "@/server/contacto";
 *   <FormularioContacto action={enviarMensajeContacto} />
 */
export type ResultadoContacto = { ok: true } | { ok: false; error: string };

interface EstadoContacto {
  /** "idle" while editing; "ok" after a successful submission. */
  fase: "idle" | "ok";
  error: string | null;
  /**
   * Incremental stamp of each successful submission. It is compared with a local
   * counter of "successes already dismissed" to know whether the thank-you still
   * applies; that way the "Enviar otro mensaje" button goes back to the form without
   * a native reset (which useActionState does not offer) or calling the action again.
   */
  exito: number;
}

const ESTADO_INICIAL: EstadoContacto = { fase: "idle", error: null, exito: 0 };

export interface FormularioContactoProps {
  action: (formData: FormData) => Promise<ResultadoContacto>;
  className?: string;
}

export function FormularioContacto({
  action,
  className,
}: FormularioContactoProps) {
  const bannerRef = React.useRef<HTMLDivElement>(null);

  const [estado, enviar, pendiente] = React.useActionState<
    EstadoContacto,
    FormData
  >(
    async (previo, formData) => {
      const resultado = await action(formData);
      if (resultado.ok) {
        return { fase: "ok", error: null, exito: previo.exito + 1 };
      }
      return { fase: "idle", error: resultado.error, exito: previo.exito };
    },
    ESTADO_INICIAL,
  );

  // Counter of successes already dismissed by the user ("Enviar otro mensaje").
  // If the action's last success exceeds this counter, we show the
  // thank-you; on dismissing it we make them equal and go back to the form (with
  // a derived key to remount the <form> clean).
  const [descartados, setDescartados] = React.useState(0);
  const mostrandoExito = estado.fase === "ok" && estado.exito > descartados;

  // When an error appears, move focus/scroll to the banner so that it is noticed.
  React.useEffect(() => {
    if (estado.error) {
      bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      bannerRef.current?.focus();
    }
  }, [estado.error]);

  if (mostrandoExito) {
    return (
      <MensajeEnviado
        className={className}
        onOtro={() => setDescartados(estado.exito)}
      />
    );
  }

  return (
    <form
      // The key changes with each dismissed success: it remounts the form, now empty.
      key={descartados}
      action={enviar}
      noValidate
      aria-describedby={estado.error ? "contacto-error" : undefined}
      className={cn("flex flex-col gap-5", className)}
    >
      {estado.error && (
        <div
          ref={bannerRef}
          id="contacto-error"
          role="alert"
          tabIndex={-1}
          className={cn(
            "flex items-start gap-3 rounded-[var(--radius-lg)] border border-rose/40 bg-rose-50 px-4 py-3.5",
            "text-step-0 text-ink outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 size-5 shrink-0 text-rose"
            strokeWidth={2}
          />
          <div>
            <p className="font-semibold text-rose">No pudimos enviar tu mensaje</p>
            <p className="mt-0.5 text-ink-soft">{estado.error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Nombre"
          name="nombre"
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          disabled={pendiente}
          placeholder="¿Cómo te llamas?"
        />
        <Input
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          disabled={pendiente}
          placeholder="tu@correo.com"
          hint="Te responderemos a esta dirección."
        />
      </div>

      <Input
        label="Asunto (opcional)"
        name="asunto"
        type="text"
        autoComplete="off"
        maxLength={120}
        disabled={pendiente}
        placeholder="Sobre qué nos escribes"
      />

      <TextareaCampo
        label="Mensaje"
        name="mensaje"
        required
        maxLength={2000}
        rows={6}
        disabled={pendiente}
        placeholder="Cuéntanos en qué podemos ayudarte. Mientras más detalles, mejor."
        hint="Máximo 2000 caracteres."
      />

      {/* --- Accessible honeypot: bot trap. It must arrive EMPTY. --- */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contacto-apellido2">No llenar este campo</label>
        <input
          id="contacto-apellido2"
          name="apellido2"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[0.8rem] text-ink-faint">
          Respondemos en horario de oficina, de lunes a viernes.
        </p>
        <Button
          type="submit"
          variant="accent"
          size="lg"
          loading={pendiente}
          disabled={pendiente}
          className="w-full sm:w-auto"
        >
          {pendiente ? "Enviando…" : "Enviar mensaje"}
        </Button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */

/**
 * TextareaCampo — textarea with the SAME visual language as <Input>: warm
 * border, focus with an indigo ring, error in rose, accessible label + hint
 * (aria-describedby / aria-invalid). Local to this form so as not to bloat the
 * UI library with a primitive that is still only used here.
 */
interface TextareaCampoProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

function TextareaCampo({
  label,
  hint,
  error,
  id,
  className,
  ...props
}: TextareaCampoProps) {
  const generado = React.useId();
  const fieldId = id ?? generado;
  const hintId = `${fieldId}-hint`;
  const errorId = `${fieldId}-error`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={fieldId}
        className="text-[0.875rem] font-medium text-ink-soft"
      >
        {label}
      </label>
      <textarea
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full resize-y rounded-[var(--radius-md)] border bg-paper-2 px-3.5 py-3 text-step-0 text-ink",
          "min-h-[7.5rem] placeholder:text-ink-faint",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-55",
          error
            ? "border-rose focus-visible:border-rose focus-visible:ring-rose/30"
            : "border-line",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-[0.8rem] font-medium text-rose">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[0.8rem] text-ink-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * MensajeEnviado — confirmation with character that REPLACES the form after
 * a successful submission. "¡Mensaje enviado!" SVG paper stamp, warm microcopy
 * and a button to write another one. The block receives focus to announce the change.
 */
function MensajeEnviado({
  onOtro,
  className,
}: {
  onOtro: () => void;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      tabIndex={-1}
      className={cn(
        "flex flex-col items-center gap-6 rounded-[var(--radius-xl)] border border-dashed border-line-strong bg-paper-2 px-6 py-12 text-center outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
        className,
      )}
    >
      <SelloEnviado />
      <div className="flex flex-col gap-2">
        <h2 className="font-display text-step-2 font-semibold text-ink">
          ¡Mensaje enviado!
        </h2>
        <p className="mx-auto max-w-md text-step-0 text-ink-soft">
          Gracias por escribirnos. Te responderemos pronto al correo que nos
          dejaste. Mientras tanto, puedes seguir curioseando útiles.
        </p>
      </div>
      <Button type="button" variant="soft" size="md" onClick={onOtro}>
        Enviar otro mensaje
      </Button>
    </div>
  );
}

/**
 * SelloEnviado — SVG "stationery stamp": toothed circle (rubber-stamp style)
 * with the check mark and a curved text. Decorative (aria-hidden); the real
 * text is given by the adjacent h2. Uses brand tokens (indigo + tangerine).
 */
function SelloEnviado() {
  return (
    <svg
      viewBox="0 0 120 120"
      aria-hidden="true"
      className="size-24 drop-shadow-[var(--shadow-card)]"
    >
      {/* Toothed border, postage-stamp style. */}
      <circle
        cx="60"
        cy="60"
        r="50"
        className="fill-mint-50 stroke-mint"
        strokeWidth="3"
        strokeDasharray="3 5"
        strokeLinecap="round"
      />
      <circle
        cx="60"
        cy="60"
        r="40"
        fill="none"
        className="stroke-primary/35"
        strokeWidth="2"
      />
      {/* Check mark in tangerine. */}
      <path
        d="M44 61 55 72 78 47"
        fill="none"
        className="stroke-accent"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Curved "ENVIADO" text following the bottom edge. */}
      <defs>
        <path id="sello-curva" d="M22 60a38 38 0 0 0 76 0" fill="none" />
      </defs>
      <text className="fill-primary text-[10px] font-semibold tracking-[0.3em]">
        <textPath href="#sello-curva" startOffset="50%" textAnchor="middle">
          ENVIADO
        </textPath>
      </text>
    </svg>
  );
}
