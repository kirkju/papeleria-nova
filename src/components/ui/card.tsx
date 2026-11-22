import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Card — Papelería Nova's raised surface, with composable slots.
 *
 * Large radius (radius-lg) and a soft warm shadow, contrasting with the
 * buttons (radius-md) to break the monotony of a single radius.
 *
 * Usage:
 *   <Card>
 *     <CardHeader>
 *       <CardTitle>Set de marcadores</CardTitle>
 *       <CardDescription>12 colores pastel</CardDescription>
 *     </CardHeader>
 *     <CardContent>…</CardContent>
 *     <CardFooter><Button>Agregar</Button></CardFooter>
 *   </Card>
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes the border and the shadow, useful inside an already colored bento. */
  flat?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, flat = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--radius-lg)] bg-paper-2 text-ink",
        !flat && "border border-line shadow-card",
        className,
      )}
      {...props}
    />
  );
});

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-5 pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "font-display text-step-1 font-semibold leading-tight text-ink",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-[0.9rem] text-ink-soft", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 p-5 pt-3", className)}
      {...props}
    />
  );
}
