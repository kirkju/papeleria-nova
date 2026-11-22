import type { Role } from "@prisma/client";
import { ETIQUETA_ROL } from "@/lib/validators/usuarios";
import { cn } from "@/lib/utils";

/**
 * UsuariosRolBadge — label with the user's role, tinted per role.
 *
 * Server-friendly (data only). Color is NEVER the only channel of information:
 * the text of the role (in Spanish, via `ETIQUETA_ROL`) is always present.
 *
 * Tints (system tokens):
 *  - ADMIN    → indigo (primary).
 *  - VENDEDOR → amber (amber).
 *  - CLIENTE  → neutral.
 */

const TINTE_ROL: Record<Role, string> = {
  ADMIN: "bg-primary-50 text-primary-600 border-primary/30",
  VENDEDOR: "bg-amber-50 text-amber border-amber/40",
  CLIENTE: "bg-paper-3 text-ink-soft border-line",
};

const recorteEtiqueta: React.CSSProperties = {
  clipPath: "polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)",
};

export function UsuariosRolBadge({ rol }: { rol: Role }) {
  return (
    <span
      style={recorteEtiqueta}
      className={cn(
        "inline-flex items-center gap-1 border px-2.5 py-0.5",
        "text-[0.72rem] font-semibold uppercase tracking-wide",
        "rounded-r-[var(--radius-sm)] rounded-bl-[var(--radius-sm)]",
        TINTE_ROL[rol],
      )}
    >
      {ETIQUETA_ROL[rol]}
    </span>
  );
}
