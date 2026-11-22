import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { obtenerDireccionesUsuario } from "@/server/direcciones";
import { PasosCheckout } from "@/components/storefront/pasos-checkout";
import { CheckoutForm } from "@/components/storefront/checkout-form";

/**
 * /checkout — completing the purchase (step 2: payment and shipping).
 *
 * Server Component. Authorization lives on the SERVER: the RBAC matrix says that
 * guests do NOT buy, so without a session we redirect to /login with a callbackUrl
 * (the `crearPedido` server action revalidates the role anyway).
 *
 * With a session: we load the user's addresses and mount the client form
 * (CheckoutForm), which reads the cart from the local store and builds `itemsJson`
 * on submit. The total is ALWAYS recalculated by the server from the DB.
 *
 * `robots: noindex` — a checkout screen is not indexed.
 */
export const metadata: Metadata = {
  title: "Finalizar compra",
  description: "Completa tu pedido en Papelería Nova.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const session = await auth();

  // Guests do not buy (RBAC). Hard barrier on the server, not just UI.
  if (!session?.user) {
    redirect("/login?callbackUrl=/checkout");
  }

  // The user's addresses (only their own; the default one first). If loading fails,
  // we go on with an empty list: the form will offer entering a new address.
  const resultado = await obtenerDireccionesUsuario();
  const direcciones = resultado.ok ? resultado.direcciones : [];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <PasosCheckout pasoActual={2} />
      </div>

      <header className="mb-8">
        <h1 className="font-display text-step-3 font-bold tracking-tight text-ink">
          Finalizar compra
        </h1>
        <p className="mt-2 text-step-0 text-ink-soft">
          Revisa tu pedido, indica a dónde lo enviamos y elige cómo pagar.
        </p>
      </header>

      <CheckoutForm
        direcciones={direcciones}
        nombreInicial={session.user.name ?? undefined}
      />
    </div>
  );
}
