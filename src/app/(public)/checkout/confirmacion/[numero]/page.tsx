import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { obtenerPedidoPorNumero } from "@/server/pedidos";
import { PasosCheckout } from "@/components/storefront/pasos-checkout";
import { PedidoConfirmado } from "@/components/storefront/pedido-confirmado";

/**
 * /checkout/confirmacion/[numero] — "thank you" screen after creating an order.
 *
 * Server Component. Requires a SESSION (without one, it redirects to /login with
 * a callbackUrl of this same URL). Access to the order is decided by the server:
 * `obtenerPedidoPorNumero` only returns it if it belongs to the user or the user
 * holds "pedido:verTodos"; if it does not exist / there is no access it returns
 * the SAME generic error, which here is turned into notFound() (we do not leak
 * existence).
 *
 * `robots: noindex` — an order confirmation is not indexed.
 */
type Params = { numero: string };

/** Formats an ISO date as DD/MM/YYYY with the es-HN locale (localization rule). */
const formatoFecha = new Intl.DateTimeFormat("es-HN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return formatoFecha.format(d);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { numero } = await params;
  return {
    title: `Pedido ${numero}`,
    description: "Detalle de tu pedido en Papelería Nova.",
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmacionPedidoPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { numero } = await params;

  const session = await auth();
  // Requires a session: hard barrier on the server. We keep the exact destination.
  if (!session?.user) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/checkout/confirmacion/${numero}`)}`,
    );
  }

  const resultado = await obtenerPedidoPorNumero(numero);
  // It does not exist or there is no access (same generic error) => friendly 404.
  if (!resultado.ok) notFound();

  const { pedido } = resultado;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto mb-2 max-w-2xl">
        <PasosCheckout pasoActual={3} />
      </div>

      <PedidoConfirmado
        pedido={{
          ...pedido,
          // The page delivers the date ALREADY formatted as DD/MM/YYYY.
          creadoEn: fechaCorta(pedido.creadoEn),
        }}
      />
    </div>
  );
}
