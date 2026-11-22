import { PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Order not found. Triggered with `notFound()` from the page when
 * `obtenerPedidoAdmin` returns null (nonexistent id). Clear message + a way back.
 */
export default function PedidoNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-paper px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-[var(--radius-lg)] bg-paper-3 text-ink-faint"
      >
        <PackageX className="size-6" strokeWidth={1.75} />
      </span>
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-step-1 font-semibold text-ink">
          Pedido no encontrado
        </h1>
        <p className="text-step-0 text-ink-soft">
          No encontramos ese pedido. Puede que se haya eliminado o que el enlace
          sea incorrecto.
        </p>
      </div>
      <Button asChildLink href="/admin/pedidos" variant="outline">
        Volver a pedidos
      </Button>
    </div>
  );
}
