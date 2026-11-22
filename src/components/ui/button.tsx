import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Button — Papelería Nova's action primitive.
 *
 * Variants: primary (indigo), accent (tangerine, CTAs), ghost, outline, soft.
 * Sizes: sm, md, lg, icon. The `loading` state shows a spinner and blocks the button.
 * Visible focus with the brand ring; touch targets ≥44px in md/lg.
 * Passing `asChildLink href="/ruta"` renders it as a <Link> with the same style.
 *
 * Usage:
 *   <Button variant="accent" size="lg">Agregar al carrito</Button>
 *   <Button variant="outline" loading>Guardando…</Button>
 *   <Button asChildLink href="/catalogo">Explorar</Button>
 */
type ButtonVariant = "primary" | "accent" | "ghost" | "outline" | "soft";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantes: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-card hover:bg-primary-600 active:translate-y-px",
  accent:
    "bg-accent text-on-accent shadow-card hover:bg-accent-600 active:translate-y-px",
  ghost: "bg-transparent text-ink hover:bg-paper-3 active:bg-paper-3",
  outline:
    "border border-line-strong bg-transparent text-ink hover:bg-paper-2 active:bg-paper-3",
  soft: "bg-primary-50 text-primary-600 hover:bg-primary-50/70 active:translate-y-px",
};

const tamanos: Record<ButtonSize, string> = {
  sm: "h-9 gap-1.5 px-3.5 text-[0.875rem] rounded-[var(--radius-sm)]",
  md: "h-11 gap-2 px-5 text-step-0 rounded-[var(--radius-md)]",
  lg: "h-13 gap-2.5 px-7 text-step-1 rounded-[var(--radius-md)]",
  icon: "h-11 w-11 justify-center rounded-[var(--radius-md)]",
};

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps
  extends ButtonBaseProps,
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  loading?: boolean;
  asChildLink?: false;
}

export interface ButtonLinkProps
  extends ButtonBaseProps,
    Omit<
      React.AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof ButtonBaseProps | "href"
    > {
  asChildLink: true;
  href: string;
}

function clasesBoton(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cn(
    "relative inline-flex select-none items-center justify-center font-medium",
    "transition-[background-color,transform,box-shadow] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
    "disabled:pointer-events-none disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    variantes[variant],
    tamanos[size],
    className,
  );
}

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | ButtonLinkProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    className,
    children,
    ...rest
  } = props;

  if (rest.asChildLink) {
    const { asChildLink: _omit, href, ...anchorProps } = rest;
    void _omit;
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={clasesBoton(variant, size, className)}
        {...anchorProps}
      >
        {children}
      </Link>
    );
  }

  const {
    asChildLink: _ignore,
    loading = false,
    disabled,
    type = "button",
    ...buttonProps
  } = rest;
  void _ignore;
  const inhabilitado = disabled || loading;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      disabled={inhabilitado}
      aria-busy={loading || undefined}
      className={clasesBoton(variant, size, className)}
      {...buttonProps}
    >
      {loading && (
        <Loader2
          aria-hidden="true"
          className="size-[1.1em] animate-spin"
          strokeWidth={2.5}
        />
      )}
      {children}
    </button>
  );
});
