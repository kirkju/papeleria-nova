import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * not-found of the product page. Shown when `obtenerProductoPorSlug`
 * returns null (nonexistent or inactive product). Friendly tone, with CTAs to
 * the catalog and the home page.
 */
export default function ProductoNoEncontrado() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
      <span
        aria-hidden="true"
        className="grid size-20 place-items-center rounded-[var(--radius-xl)] rounded-tl-[var(--radius-md)] bg-primary-50 text-primary-600"
      >
        <SearchX className="size-9" strokeWidth={1.75} />
      </span>

      <div className="flex flex-col gap-2">
        <h1 className="font-display text-step-3 font-semibold text-ink">
          No encontramos ese producto
        </h1>
        <p className="text-step-0 text-ink-soft">
          Puede que se haya agotado, lo hayamos retirado o el enlace tenga un
          error. Pero tranquilo: en el catálogo hay muchos útiles esperándote.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button asChildLink href="/catalogo" variant="accent" size="lg">
          Ver el catálogo
        </Button>
        <Button asChildLink href="/" variant="outline" size="lg">
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}
