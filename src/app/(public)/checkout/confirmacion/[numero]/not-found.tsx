import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * not-found of the order confirmation. Shown when `obtenerPedidoPorNumero`
 * does not return the order: nonexistent number or no access (the server does
 * not distinguish the two cases so as not to leak existence). Friendly tone,
 * with CTAs to the catalog and the cart.
 */
export default function PedidoNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      <span
        aria-hidden="true"
        className="grid size-20 place-items-center rounded-[var(--radius-xl)] rounded-tl-[var(--radius-md)] bg-primary-50 text-primary-600"
      >
        <PackageSearch className="size-9" strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-step-3 font-semibold text-ink">
          No encontramos ese pedido
        </h1>
        <p className="text-step-0 text-ink-soft">
          Puede que el número esté mal escrito o que este pedido no esté asociado
          a tu cuenta. Revisa el enlace o inicia sesión con la cuenta correcta.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button asChildLink href="/catalogo" variant="accent" size="lg">
          Ver el catálogo
        </Button>
        <Button asChildLink href="/carrito" variant="outline" size="lg">
          Volver a mi carrito
        </Button>
      </div>
    </div>
  );
}
