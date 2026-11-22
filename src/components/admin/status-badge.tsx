import * as React from "react";
import {
  Check,
  CheckCheck,
  Clock,
  Truck,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

/**
 * StatusBadge — status label of an order, built on the Badge primitive.
 *
 * Statuses of Order.estado (Prisma enum). Each one with a semantic color + icon +
 * capitalized Spanish text: it is NEVER conveyed by color alone (it carries text
 * and an icon). The icon is aria-hidden; the text is the accessible name.
 *
 *  - PENDIENTE  → amber  (clock)         awaiting payment
 *  - PAGADO     → mint   (check)         payment confirmed
 *  - ENVIADO    → indigo (truck)         in transit
 *  - ENTREGADO  → strong mint (double ✓) completed
 *  - CANCELADO  → rose   (cross)         voided
 *
 * Usage:
 *   <StatusBadge estado="PAGADO" />
 */
export type EstadoPedido =
  | "PENDIENTE"
  | "PAGADO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const CONFIG: Record<
  EstadoPedido,
  { etiqueta: string; variant: BadgeVariant; icono: LucideIcon; clase?: string }
> = {
  PENDIENTE: { etiqueta: "Pendiente", variant: "stock-bajo", icono: Clock },
  PAGADO: { etiqueta: "Pagado", variant: "nuevo", icono: Check },
  // ENVIADO uses indigo (primary): the Badge has no "primary" variant, so
  // we start from "neutral" and override the colors with brand tokens.
  ENVIADO: {
    etiqueta: "Enviado",
    variant: "neutral",
    icono: Truck,
    clase: "bg-primary-50 text-primary-600 border-primary/30",
  },
  // ENTREGADO: strong mint (filled) to tell it apart from PAGADO (soft mint).
  ENTREGADO: {
    etiqueta: "Entregado",
    variant: "neutral",
    icono: CheckCheck,
    clase: "bg-mint text-on-primary border-mint",
  },
  CANCELADO: { etiqueta: "Cancelado", variant: "agotado", icono: X },
};

export function StatusBadge({ estado }: { estado: EstadoPedido }) {
  const { etiqueta, variant, icono: Icono, clase } = CONFIG[estado];
  return (
    <Badge variant={variant} className={clase}>
      <Icono aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      {etiqueta}
    </Badge>
  );
}
