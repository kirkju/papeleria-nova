import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guard";
import { AdminShell } from "@/components/admin/admin-shell";

/**
 * Layout of the administration panel (Server Component).
 *
 * HARD defense on top of the proxy: although the middleware already screens
 * /admin/** for VENDEDOR|ADMIN as a UX barrier, the role is required again here on
 * the server. If it fails (not authenticated or insufficient role), it redirects
 * to /no-autorizado.
 *
 * Each PAGE and each server action also keep their own hard validation
 * (requireRole / assertCan) for the permission they touch: this layout only opens
 * the door to the panel; it does not authorize specific actions.
 *
 * The layout gets role + name and passes them to the AdminShell (which renders the
 * sidebar, topbar and identity). The child pages mount their content with
 * PageHeader + the admin components; the shell gives them the frame and the
 * paper-2 background.
 */
export const metadata: Metadata = {
  title: {
    default: "Admin Papelería Nova",
    template: "%s · Admin Papelería Nova",
  },
  // The panel must not be indexed.
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let usuario;
  try {
    usuario = await requireRole(["VENDEDOR", "ADMIN"]);
  } catch {
    redirect("/no-autorizado");
  }

  const nombre = usuario.name?.trim() || usuario.email || "Usuario";

  return (
    <AdminShell rol={usuario.role} nombre={nombre}>
      {children}
    </AdminShell>
  );
}
