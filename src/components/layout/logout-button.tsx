"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { sincronizarCarrito } from "@/server/carrito";
import { cerrarSesion } from "@/server/auth";

/**
 * LogoutButton — signs out after first "flushing" the cart to the DB.
 *
 * The normal cart push is debounced (~800ms in CartSync); if the user edits
 * the cart and signs out within that window, that last change would be lost
 * (the sync server action would no longer have a valid session). That is why
 * here, BEFORE invalidating the session, the current state of the cart is
 * sent with an immediate replace-all. If the flush fails, the session is closed
 * anyway: blocking the logout would be worse than losing a cart edit.
 */
export function LogoutButton({ className }: { className?: string }) {
  const [saliendo, setSaliendo] = React.useState(false);

  const onClick = async () => {
    if (saliendo) return;
    setSaliendo(true);
    try {
      const { items, owner } = useCartStore.getState();
      if (owner !== null) {
        await sincronizarCarrito(
          items.map((i) => ({ productId: i.productId, cantidad: i.cantidad })),
        );
      }
    } catch {
      // Better to sign out anyway than to leave the user stuck.
    }
    // CartSync runs the local store's resetear() when it detects userId=null.
    await cerrarSesion();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saliendo}
      aria-label="Cerrar sesión"
      aria-busy={saliendo}
      className={
        className ??
        "inline-flex size-11 items-center justify-center rounded-[var(--radius-md)] text-ink-soft transition-colors hover:bg-paper-3 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-60"
      }
    >
      <LogOut aria-hidden="true" className="size-5" strokeWidth={1.75} />
    </button>
  );
}
