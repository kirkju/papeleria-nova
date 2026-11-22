import type { Role } from "@prisma/client";
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Definition of the admin navigation, derived from the role matrix.
 *
 * Server-friendly (data only). The AdminShell filters it by role and also
 * marks as "próximamente" (disabled) whatever has no page yet.
 *
 * Rules (the project's role permissions and the permission guard):
 *  - Dashboard and Orders: VENDEDOR and ADMIN.
 *  - Products: VENDEDOR and ADMIN (the seller enters in inventory mode; the
 *    hard distinction of what they can mutate lives in each server action).
 *  - Users and Categories: ADMIN ONLY.
 *
 * `proximamente: true` => visible but disabled (future section). The role
 * filtering decides whether the item is shown; `proximamente` decides whether it
 * is navigable. The actual pages are built elsewhere; this shell only links to them.
 */
export interface ItemNav {
  href: string;
  etiqueta: string;
  icono: LucideIcon;
  /** Roles that SEE the item. */
  roles: readonly Role[];
  /** Section without a page yet: shown disabled with a "Pronto" badge. */
  proximamente?: boolean;
  /**
   * If true, the item is only marked active on an EXACT route match
   * (for "/admin", which is a prefix of everything else). By default it is also
   * marked active on subroutes (prefix).
   */
  exacto?: boolean;
}

const TODOS: readonly Role[] = ["VENDEDOR", "ADMIN"];
const SOLO_ADMIN: readonly Role[] = ["ADMIN"];

export const NAV_ADMIN: readonly ItemNav[] = [
  {
    href: "/admin",
    etiqueta: "Dashboard",
    icono: LayoutDashboard,
    roles: TODOS,
    exacto: true,
  },
  {
    href: "/admin/pedidos",
    etiqueta: "Pedidos",
    icono: ShoppingCart,
    roles: TODOS,
  },
  {
    href: "/admin/productos",
    etiqueta: "Productos",
    icono: Package,
    roles: TODOS,
  },
  {
    href: "/admin/inventario",
    etiqueta: "Inventario",
    icono: Boxes,
    roles: TODOS,
    proximamente: true,
  },
  {
    href: "/admin/categorias",
    etiqueta: "Categorías",
    icono: FolderTree,
    roles: SOLO_ADMIN,
    proximamente: true,
  },
  {
    href: "/admin/usuarios",
    etiqueta: "Usuarios",
    icono: Users,
    roles: SOLO_ADMIN,
  },
];

/** Readable label of the role to show in the topbar. */
export const ETIQUETA_ROL: Record<Role, string> = {
  CLIENTE: "Cliente",
  VENDEDOR: "Vendedor",
  ADMIN: "Administrador",
};

/**
 * Does the route `pathname` correspond to the item `item`?
 * - exacto: strict equality.
 * - prefix: equal or a subroute (item.href followed by "/").
 */
export function esRutaActiva(item: ItemNav, pathname: string): boolean {
  if (item.exacto) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
