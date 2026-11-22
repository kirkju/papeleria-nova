import { EstadoVacio } from "@/components/storefront/estado-vacio";
import { Button } from "@/components/ui/button";

/**
 * not-found.tsx of /cuenta/pedidos/[numero] — shown when
 * `obtenerPedidoPorNumero` does not return the order (it does not exist OR is not
 * the user's; the generic message does not distinguish, so as not to leak
 * existence). CTA back to the order list. Reuses the storefront's EstadoVacio.
 */
export default function PedidoNoEncontrado() {
  return (
    <EstadoVacio
      titulo="No encontramos ese pedido"
      descripcion="Puede que el número sea incorrecto o que este pedido no esté asociado a tu cuenta. Revisa tu lista de pedidos."
    >
      <Button asChildLink href="/cuenta/pedidos" variant="primary">
        Ver mis pedidos
      </Button>
      <Button asChildLink href="/catalogo" variant="outline">
        Ir al catálogo
      </Button>
    </EstadoVacio>
  );
}
