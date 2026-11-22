import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Papelería Nova cart store.
 *
 * Persisted in localStorage (key "pn-cart") to survive reloads.
 *
 * Each item carries `sku` and `stock`, and quantities are clamped to `1..stock`
 * so that the client never exceeds the known stock. The server revalidates
 * stock at checkout (rule: the server recalculates everything from the DB; the
 * client is only a convenience).
 *
 * Conventions of this store (deliberate, so as not to break existing code):
 * - The persistence key is "pn-cart".
 * - The API is named addItem/removeItem/setCantidad/clear; totals are not
 *   store methods: the derived selectors live separately.
 *
 * Synchronization with the session (implemented by @/components/storefront/cart-sync):
 * - `owner` (persisted) is the id of the local cart's owner: `null` = anonymous,
 *   or the `userId` whose session hydrated/owns this cart. The `owner`
 *   transition is driven by CartSync per the login/logout state machine.
 * - On SIGN-IN this cart is merged with the one in the DB (server action
 *   `fusionarCarrito`): it adds up quantities per productId respecting live stock;
 *   the result replaces items + owner in one go via `setAll`.
 * - With an ACTIVE SESSION the local store rules and is pushed to the DB with a
 *   debounce (`sincronizarCarrito`, replace-all validated on the server).
 * - On SIGN-OUT `resetear()` is called (items + owner) — the cart persists
 *   in the DB for the next login. The server revalidates stock at checkout.
 */
export interface CartItem {
  productId: string;
  nombre: string;
  /** Unit price in Lempiras. */
  precio: number;
  /** Product SKU (snapshot for display and for the order). */
  sku: string;
  /** Stock known when the item was added; cap for clamping quantities on the client. */
  stock: number;
  imagen?: string;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  /**
   * Owner of the local cart: `null` = anonymous (localStorage only), or the `userId`
   * whose session owns this cart. CartSync manages it (login/logout); the rest
   * of the UI should not touch it. Persisted together with the items.
   */
  owner: string | null;
  /**
   * Adds an item; if it already exists, adds to its quantity. The accumulated
   * quantity is clamped to `1..stock` (it uses the incoming item's `stock` as the
   * current cap). If the stock is 0, nothing is added.
   */
  addItem: (item: Omit<CartItem, "cantidad">, cantidad?: number) => void;
  removeItem: (productId: string) => void;
  /** Sets the exact quantity, clamped to `1..stock`; <= 0 removes the item. */
  setCantidad: (productId: string, cantidad: number) => void;
  /**
   * Empties the items but KEEPS the `owner` ("empty cart" semantics: it is still
   * the same user's cart, now empty).
   */
  clear: () => void;
  /**
   * Replaces items and owner in a single step (used by CartSync after merging the
   * cart on sign-in: it hydrates the store with what the server returns
   * and marks the user as the owner).
   */
  setAll: (items: CartItem[], owner: string | null) => void;
  /** Sets only the owner of the local cart (without touching the items). */
  setOwner: (owner: string | null) => void;
  /**
   * Clears items AND owner (used by CartSync on SIGN-OUT): the local cart
   * goes back to the anonymous-empty state; the real cart persists in the DB.
   */
  resetear: () => void;
}

/** Clamps an integer to the [min, max] range. */
function clamp(valor: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, valor));
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      owner: null,

      addItem: (item, cantidad = 1) =>
        set((state) => {
          // Out of stock: nothing is added (the UI must show "Agotado").
          if (item.stock <= 0) return state;

          const aSumar = Math.max(1, Math.floor(cantidad));
          const existente = state.items.find(
            (i) => i.productId === item.productId,
          );

          if (existente) {
            // Uses the most recent stock (the incoming item's) as the cap.
            const cant = clamp(
              existente.cantidad + aSumar,
              1,
              item.stock,
            );
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, ...item, cantidad: cant }
                  : i,
              ),
            };
          }

          const cant = clamp(aSumar, 1, item.stock);
          return { items: [...state.items, { ...item, cantidad: cant }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),

      setCantidad: (productId, cantidad) =>
        set((state) => {
          const pedida = Math.floor(cantidad);
          if (pedida <= 0) {
            return {
              items: state.items.filter((i) => i.productId !== productId),
            };
          }
          return {
            items: state.items.map((i) =>
              i.productId === productId
                ? { ...i, cantidad: clamp(pedida, 1, Math.max(1, i.stock)) }
                : i,
            ),
          };
        }),

      // "Empty cart": keeps the owner (the cart still belongs to the user).
      clear: () => set({ items: [] }),

      // Atomic replacement of items + owner (hydration after the merge on login).
      setAll: (items, owner) => set({ items, owner }),

      setOwner: (owner) => set({ owner }),

      // Logout: clears everything and goes back to anonymous. The cart lives in the DB.
      resetear: () => set({ items: [], owner: null }),
    }),
    {
      name: "pn-cart",
      storage: createJSONStorage(() => localStorage),
      // v2 adds the persisted `owner` field. Carts persisted with v1 (no
      // owner) are migrated to the anonymous state: owner = null. We do not touch the
      // items (they are still valid); CartSync will decide the merge on the next login.
      version: 2,
      migrate: (estadoPersistido, versionPrevia) => {
        if (versionPrevia < 2) {
          const previo = (estadoPersistido ?? {}) as Partial<CartState>;
          return {
            ...previo,
            // Defense against a corrupt v1 state: items is always an array.
            items: Array.isArray(previo.items) ? previo.items : [],
            owner: null,
          } as CartState;
        }
        return estadoPersistido as CartState;
      },
      // We do not persist the functions; only the data (items + owner).
      partialize: (state) => ({ items: state.items, owner: state.owner }),
    },
  ),
);

/* ============================================================
   Derived selectors — use with useCartStore(selector) to
   subscribe only to the data that matters and avoid extra renders.
   ============================================================ */

/** Total units in the cart (sum of quantities). */
export const selectTotalItems = (state: CartState): number =>
  state.items.reduce((acc, i) => acc + i.cantidad, 0);

/** Total to pay in Lempiras (number, unformatted). */
export const selectTotalLempiras = (state: CartState): number =>
  state.items.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
