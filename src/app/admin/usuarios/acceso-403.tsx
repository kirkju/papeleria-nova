import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Acceso403 — access-denied panel for the admin's USERS page
 * (Server Component). Rendered when `listarUsuariosAdmin` throws `AuthError`
 * because the session's role falls short of "usuario:listar" (ADMIN ONLY).
 *
 * NOTE: the /admin/** proxy admits VENDEDOR|ADMIN, so a seller DOES reach
 * this route; this is where the hard barrier of the server action stops them.
 * This is the VISIBLE safety net, consistent with `error.mensajePublico`; it
 * leaks no technical detail. (Twin pattern of the one in /admin/pedidos.)
 */
export function Acceso403({ mensaje }: { mensaje: string }) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper px-6 py-12 text-center"
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-[var(--radius-lg)] bg-rose-50 text-rose"
      >
        <ShieldAlert className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-step-1 font-semibold text-ink">
          Acceso restringido
        </h1>
        <p className="text-step-0 text-ink-soft">{mensaje}</p>
      </div>
      <Button asChildLink href="/admin" variant="outline">
        Volver al panel
      </Button>
    </div>
  );
}
