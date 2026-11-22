"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound, Package } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CuentaSubnav — sub-navigation of the account area (small client island).
 *
 * Renders the area's two destinations ("Perfil" → /cuenta, "Mis pedidos" →
 * /cuenta/pedidos) and resolves the active tab with `usePathname`, marking it
 * with `aria-current="page"`. Detection is by prefix so that the detail of an
 * order (/cuenta/pedidos/[numero]) keeps "Mis pedidos" active.
 *
 * It adapts to the viewport with no extra JS: on mobile it is a horizontal,
 * scrollable "tabs" bar; at md+ it becomes a sidebar-like column (decided by
 * the layout's wrapper via the classes of each state). Visible focus and
 * targets ≥44px. No fill animations: only a color transition.
 *
 * Usage (from the server layout of the (cuenta) group):
 *   <CuentaSubnav />
 */
const ENLACES = [
  { href: "/cuenta", label: "Perfil", icono: UserRound, exacto: true },
  {
    href: "/cuenta/pedidos",
    label: "Mis pedidos",
    icono: Package,
    exacto: false,
  },
] as const;

export function CuentaSubnav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones de mi cuenta">
      <ul
        role="list"
        className="flex gap-1.5 overflow-x-auto pb-1 md:flex-col md:gap-1 md:overflow-visible md:pb-0"
      >
        {ENLACES.map(({ href, label, icono: Icono, exacto }) => {
          const activo = exacto
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 w-full items-center gap-2.5 whitespace-nowrap rounded-[var(--radius-md)] px-3.5 text-step-0 font-medium",
                  "transition-colors duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                  activo
                    ? "bg-primary text-on-primary shadow-card md:bg-primary-50 md:text-primary-600 md:shadow-none"
                    : "text-ink-soft hover:bg-paper-3 hover:text-ink",
                )}
              >
                <Icono
                  aria-hidden="true"
                  className="size-5 shrink-0"
                  strokeWidth={1.85}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
