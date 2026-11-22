import type { Metadata } from "next";
import { CarritoPageContent } from "@/components/storefront/carrito-page-content";

/**
 * /carrito page — full view of the Papelería Nova cart.
 *
 * Server Component shell: it only defines metadata (noindex, the cart is private
 * and ephemeral) and renders the client island with the store data. The content
 * lives in CarritoPageContent because it depends on the Zustand store persisted in
 * localStorage (only available on the client).
 */
export const metadata: Metadata = {
  title: "Tu carrito",
  description: "Revisa los útiles que tienes en tu carrito antes de pagar.",
  robots: { index: false, follow: false },
};

export default function CarritoPage() {
  return <CarritoPageContent />;
}
