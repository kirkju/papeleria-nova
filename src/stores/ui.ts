import { create } from "zustand";

/**
 * Papelería Nova ephemeral UI store.
 *
 * Interface state that must NOT persist across reloads (unlike the cart): the
 * open/closed state of the CartDrawer lives here. No `persist` on purpose —
 * when the page reloads, the drawer always starts closed.
 *
 * The state of the cart data lives in `@/stores/cart`; this store only
 * controls the *presentation* of the side panel. Keeping them apart avoids
 * re-rendering the badge/counter when the drawer opens or closes.
 *
 * Usage:
 *   const abrir = useUiStore((s) => s.abrirCarrito);
 *   const abierto = useUiStore((s) => s.carritoAbierto);
 */
interface UiState {
  /** Is the CartDrawer visible? */
  carritoAbierto: boolean;
  /** Opens the cart side panel. */
  abrirCarrito: () => void;
  /** Closes the cart side panel. */
  cerrarCarrito: () => void;
  /** Toggles the cart side panel. */
  toggleCarrito: () => void;
}

export const useUiStore = create<UiState>()((set) => ({
  carritoAbierto: false,
  abrirCarrito: () => set({ carritoAbierto: true }),
  cerrarCarrito: () => set({ carritoAbierto: false }),
  toggleCarrito: () =>
    set((state) => ({ carritoAbierto: !state.carritoAbierto })),
}));
