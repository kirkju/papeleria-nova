import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input — Papelería Nova's text field.
 *
 * Supports a label, a hint and an accessible error message (aria-describedby +
 * aria-invalid). Warm border, focus with an indigo ring, error in rose.
 *
 * Usage:
 *   <Input label="Correo" type="email" hint="Te enviaremos la confirmación" />
 *   <Input label="Nombre" error="Este campo es obligatorio" />
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  /** Decorative element on the left (e.g. a search icon). */
  leading?: React.ReactNode;
  contenedorClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { className, contenedorClassName, label, hint, error, leading, id, ...props },
    ref,
  ) {
    const generado = React.useId();
    const inputId = id ?? generado;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;
    const describedBy =
      [error ? errorId : null, hint ? hintId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", contenedorClassName)}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-[0.875rem] font-medium text-ink-soft"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leading && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 flex text-ink-faint"
            >
              {leading}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              "h-11 w-full rounded-[var(--radius-md)] border bg-paper-2 px-3.5 text-step-0 text-ink",
              "placeholder:text-ink-faint",
              "transition-[border-color,box-shadow] duration-200 ease-out",
              "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40",
              "disabled:cursor-not-allowed disabled:opacity-55",
              leading && "pl-10",
              error
                ? "border-rose focus-visible:border-rose focus-visible:ring-rose/30"
                : "border-line",
              className,
            )}
            {...props}
          />
        </div>
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
  },
);
