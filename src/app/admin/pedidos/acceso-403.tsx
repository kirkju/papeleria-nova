import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Acceso403 — access-denied panel for the admin's order pages
 * (Server Component). Rendered when a protected read throws `AuthError`
 * and the session's role falls short of "pedido:verTodos".
 *
 * The /admin/** proxy is already the earlier UX barrier; this is the visible safety
 * net, consistent with `error.mensajePublico`. It leaks no technical detail.
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
