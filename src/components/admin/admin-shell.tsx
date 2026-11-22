"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";
import { cn } from "@/lib/utils";
import {
  ETIQUETA_ROL,
  NAV_ADMIN,
  esRutaActiva,
  type ItemNav,
} from "./navegacion";

/**
 * AdminShell — frame of the administration panel.
 *
 * Receives the user's role and name (resolved on the server by the layout)
 * and mounts: a PER-ROLE navigation sidebar (collapsible to icons on desktop,
 * an accessible drawer at <lg), a topbar with the page title (NOT through the
 * top `children` slot; each page sets the title via PageHeader) + identity +
 * user + sign out, and the content area on a paper-2 background to set it apart
 * from the storefront.
 *
 * Its own "Pn · Admin" identity (it does NOT reuse the storefront header). A
 * "Ver tienda" link to /. The active state is computed with usePathname and
 * announced with aria-current="page".
 *
 * Responsive:
 *  - >=lg: fixed sidebar; a button collapses/expands it (icon ↔ icon+text).
 *  - <lg: hidden sidebar; a hamburger button opens a drawer (overlay + left
 *    panel) with focus/Escape; it closes on navigation.
 */
export function AdminShell({
  rol,
  nombre,
  children,
}: {
  rol: Role;
  nombre: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [colapsado, setColapsado] = React.useState(false);
  const [drawerAbierto, setDrawerAbierto] = React.useState(false);

  // Items visible to the current role (UI filtering; the hard barrier is in
  // the layout and in each server action/page).
  const items = React.useMemo(
    () => NAV_ADMIN.filter((i) => i.roles.includes(rol)),
    [rol],
  );

  // Closes the mobile drawer on any route change. It is adjusted during
  // render (React's recommended pattern) instead of an effect with setState, which
  // would trigger cascading renders. We keep the previous pathname and, if it
  // changed with the drawer open, we close it synchronously.
  const [rutaPrevia, setRutaPrevia] = React.useState(pathname);
  if (pathname !== rutaPrevia) {
    setRutaPrevia(pathname);
    if (drawerAbierto) setDrawerAbierto(false);
  }

  return (
    <div className="flex min-h-svh bg-paper-2">
      {/* Desktop sidebar (>=lg) */}
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-line bg-paper lg:flex",
          "transition-[width] duration-200 ease-out",
          colapsado ? "w-[4.75rem]" : "w-64",
        )}
        aria-label="Navegación del panel"
      >
        <Identidad colapsado={colapsado} />
        <NavLista
          items={items}
          pathname={pathname}
          colapsado={colapsado}
        />
        <PieSidebar colapsado={colapsado} />
        <button
          type="button"
          onClick={() => setColapsado((v) => !v)}
          aria-pressed={colapsado}
          className="m-3 mt-0 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-paper-2 px-3 text-step--1 font-medium text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {colapsado ? (
            <PanelLeftOpen aria-hidden="true" className="size-5" strokeWidth={1.75} />
          ) : (
            <>
              <PanelLeftClose aria-hidden="true" className="size-5" strokeWidth={1.75} />
              Colapsar
            </>
          )}
          <span className="sr-only">
            {colapsado ? "Expandir menú" : "Colapsar menú"}
          </span>
        </button>
      </aside>

      {/* Mobile/tablet drawer (<lg) */}
      <DrawerMovil
        abierto={drawerAbierto}
        onCerrar={() => setDrawerAbierto(false)}
        items={items}
        pathname={pathname}
      />

      {/* Content column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          nombre={nombre}
          rol={rol}
          onAbrirDrawer={() => setDrawerAbierto(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

/* ── Identity ─────────────────────────────────────────────────────────────── */

function Identidad({ colapsado }: { colapsado: boolean }) {
  return (
    <div className="flex h-16 items-center gap-2 border-b border-line px-3.5">
      <Link
        href="/admin"
        aria-label="Panel de administración, inicio"
        className="flex items-center gap-2 rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
      >
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary font-display text-step-1 font-bold leading-none text-on-primary"
        >
          Pn
        </span>
        {!colapsado ? (
          <span className="font-display text-step-1 font-semibold tracking-tight text-ink">
            <span className="text-ink-faint">·</span> Admin
          </span>
        ) : null}
      </Link>
    </div>
  );
}

/* ── Navigation list ──────────────────────────────────────────────────────── */

function NavLista({
  items,
  pathname,
  colapsado,
}: {
  items: readonly ItemNav[];
  pathname: string;
  colapsado: boolean;
}) {
  return (
    <nav
      aria-label="Secciones del panel"
      className="flex-1 overflow-y-auto px-3 py-3"
    >
      <ul className="flex flex-col gap-1" role="list">
        {items.map((item) => (
          <li key={item.href}>
            <NavEnlace
              item={item}
              activo={esRutaActiva(item, pathname)}
              colapsado={colapsado}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavEnlace({
  item,
  activo,
  colapsado,
}: {
  item: ItemNav;
  activo: boolean;
  colapsado: boolean;
}) {
  const Icono = item.icono;
  const base =
    "group relative flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-step-0 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  // Future section: not navigable, marked with a "Pronto" badge.
  if (item.proximamente) {
    return (
      <span
        aria-disabled="true"
        title="Próximamente"
        className={cn(
          base,
          "cursor-not-allowed text-ink-faint",
          colapsado && "justify-center px-0",
        )}
      >
        <Icono aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
        {!colapsado ? (
          <>
            <span className="truncate">{item.etiqueta}</span>
            <Badge variant="neutral" className="ml-auto text-[0.6rem]">
              Pronto
            </Badge>
          </>
        ) : (
          <span className="sr-only">{item.etiqueta} (próximamente)</span>
        )}
      </span>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={activo ? "page" : undefined}
      title={colapsado ? item.etiqueta : undefined}
      className={cn(
        base,
        colapsado && "justify-center px-0",
        activo
          ? "bg-primary-50 text-primary-600"
          : "text-ink-soft hover:bg-paper-3 hover:text-ink",
      )}
    >
      {/* Active indicator: indigo bar on the left (not just text color). */}
      {activo ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary"
        />
      ) : null}
      <Icono
        aria-hidden="true"
        className="size-5 shrink-0"
        strokeWidth={activo ? 2.25 : 1.75}
      />
      {!colapsado ? (
        <span className="truncate">{item.etiqueta}</span>
      ) : (
        <span className="sr-only">{item.etiqueta}</span>
      )}
    </Link>
  );
}

/* ── Sidebar footer: back to the store ────────────────────────────────────── */

function PieSidebar({ colapsado }: { colapsado: boolean }) {
  return (
    <div className="border-t border-line p-3">
      <Link
        href="/"
        title={colapsado ? "Ver tienda" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-step--1 font-medium text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          colapsado && "justify-center px-0",
        )}
      >
        <ArrowLeft aria-hidden="true" className="size-4.5 shrink-0" strokeWidth={1.75} />
        {!colapsado ? "Ver tienda" : <span className="sr-only">Ver tienda</span>}
      </Link>
    </div>
  );
}

/* ── Topbar ───────────────────────────────────────────────────────────────── */

function Topbar({
  nombre,
  rol,
  onAbrirDrawer,
}: {
  nombre: string;
  rol: Role;
  onAbrirDrawer: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Hamburger, <lg only */}
      <button
        type="button"
        onClick={onAbrirDrawer}
        aria-label="Abrir menú de navegación"
        aria-haspopup="dialog"
        className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      >
        <Menu aria-hidden="true" className="size-5.5" strokeWidth={1.75} />
      </button>

      {/* Compact identity on mobile (the sidebar is hidden) */}
      <Link
        href="/admin"
        className="flex items-center gap-2 font-display text-step-1 font-semibold text-ink lg:hidden"
        aria-label="Panel, inicio"
      >
        <span
          aria-hidden="true"
          className="grid size-8 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary text-step-0 font-bold leading-none text-on-primary"
        >
          Pn
        </span>
        <span className="hidden sm:inline">Admin</span>
      </Link>

      {/* User + sign out, on the right */}
      <div className="ml-auto flex items-center gap-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="max-w-40 truncate text-step--1 font-semibold text-ink">
            {nombre}
          </span>
          <Badge variant="neutral" className="text-[0.6rem]">
            {ETIQUETA_ROL[rol]}
          </Badge>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}

/* ── Mobile drawer ────────────────────────────────────────────────────────── */

function DrawerMovil({
  abierto,
  onCerrar,
  items,
  pathname,
}: {
  abierto: boolean;
  onCerrar: () => void;
  items: readonly ItemNav[];
  pathname: string;
}) {
  const reducir = useReducedMotion();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const tituloId = React.useId();

  // Escape + scroll lock + focus returned (the CartDrawer pattern).
  React.useEffect(() => {
    if (!abierto) return;
    const disparador = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (disparador && document.contains(disparador)) disparador.focus();
    };
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div
            role="presentation"
            onClick={onCerrar}
            className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            tabIndex={-1}
            initial={reducir ? { opacity: 0 } : { x: "-100%" }}
            animate={reducir ? { opacity: 1 } : { x: 0 }}
            exit={reducir ? { opacity: 0 } : { x: "-100%" }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col bg-paper shadow-lift focus:outline-none"
          >
            <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-3.5">
              <span
                id={tituloId}
                className="flex items-center gap-2 font-display text-step-1 font-semibold tracking-tight text-ink"
              >
                <span
                  aria-hidden="true"
                  className="grid size-9 place-items-center rounded-[var(--radius-md)] rounded-tl-[var(--radius-sm)] bg-primary font-bold leading-none text-on-primary"
                >
                  Pn
                </span>
                <span className="sr-only">Panel</span>
                <span aria-hidden="true" className="text-ink-faint">
                  ·
                </span>{" "}
                Admin
              </span>
              <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar menú"
                className="inline-flex size-10 items-center justify-center rounded-[var(--radius-md)] text-ink transition-colors hover:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <NavLista items={items} pathname={pathname} colapsado={false} />
            <PieSidebar colapsado={false} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
