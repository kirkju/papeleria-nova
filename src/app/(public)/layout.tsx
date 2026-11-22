import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartSync } from "@/components/storefront/cart-sync";

/**
 * Layout of the public storefront: accessibility skip-link, Header, main
 * content with an anchor id and Footer. It applies to the home page, catalog,
 * product and informational pages inside the (public) group.
 *
 * It mounts CartSync (UI-less client island) with the session's userId to merge /
 * synchronize / reset the local cart on login and logout. The call to
 * auth() is deduplicated per request (the Header uses it too).
 */
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-[var(--radius-md)] bg-primary px-4 py-2 font-medium text-on-primary focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-paper"
      >
        Saltar al contenido
      </a>
      <CartSync userId={session?.user?.id ?? null} />
      <Header />
      <main id="contenido" className="relative z-[1] flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
