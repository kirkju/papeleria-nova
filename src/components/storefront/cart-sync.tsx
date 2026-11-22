"use client";

import * as React from "react";
import { useCartStore, type CartItem } from "@/stores/cart";
import {
  fusionarCarrito,
  obtenerCarrito,
  sincronizarCarrito,
  type ItemCarritoSync,
} from "@/server/carrito";

/**
 * CartSync — synchronizes the local cart (Zustand + localStorage) with the cart
 * persisted in the database according to the session state. It renders no UI.
 *
 * It is mounted only once in the storefront layout with the session's `userId`
 * (server). Each time the layout re-renders (login/logout via
 * router.refresh / revalidation), it receives the new `userId` and reacts.
 *
 * State machine (compares the session's `userId` against the store's `owner`):
 *
 *   userId=null & owner=null        → ANONYMOUS: does nothing.
 *   userId=null & owner≠null        → LOGOUT: resetear() (the cart lives in the DB).
 *   userId≠null & owner===userId    → SAME SESSION: pushes changes to the DB with a
 *                                     debounce (sincronizarCarrito, replace-all).
 *   userId≠null & owner≠userId      → LOGIN / account switch: fusionarCarrito
 *                                     (adds up local + DB), then setAll(res, userId).
 *
 * Robustness notes:
 * - It uses refs for the machine state and to dedupe pushes; it tolerates
 *   React StrictMode's double effects (everything is idempotent).
 * - The server is the authority: the client only sends { productId, cantidad };
 *   price/stock/name are resolved by the DB. That is why we rewrite the store with
 *   the server's response (clamped to live stock, without inactive products).
 * - The store's `imagen` is `string | undefined`; the server returns `string | null`.
 *   It is normalized with `?? undefined` when hydrating.
 */

const DEBOUNCE_MS = 800;
const REINTENTO_FUSION_MS = 2000;

/** Normalizes an item returned by the server to the shape of the local store. */
function aItemStore(item: ItemCarritoSync): CartItem {
  return {
    productId: item.productId,
    nombre: item.nombre,
    precio: item.precio,
    sku: item.sku,
    stock: item.stock,
    imagen: item.imagen ?? undefined,
    cantidad: item.cantidad,
  };
}

/** Minimal, stable payload that travels to the server (only id + cantidad). */
function aPayloadPlano(
  items: CartItem[],
): { productId: string; cantidad: number }[] {
  return items.map((i) => ({ productId: i.productId, cantidad: i.cantidad }));
}

/** JSON signature of the payload, to detect whether there was a real change. */
function firma(items: CartItem[]): string {
  return JSON.stringify(aPayloadPlano(items));
}

export function CartSync({ userId }: { userId: string | null }) {
  // ── Machine refs (they cause no render) ────────────────────────────────────
  // Last signature successfully sent to the server (or known to be in the DB already):
  // avoids redundant pushes and StrictMode double effects.
  const ultimaFirmaEnviada = React.useRef<string | null>(null);
  // Timer of the push debounce (active session).
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Timer of the merge retry.
  const reintentoRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // Prevents launching concurrent merges for the same login.
  const fusionEnCurso = React.useRef(false);

  // ── EFFECT 1: session transition (login / logout / account switch) ──────────
  React.useEffect(() => {
    const owner = useCartStore.getState().owner;

    // ANONYMOUS: no session and no previous owner. Nothing to do.
    if (userId === null && owner === null) {
      return;
    }

    // LOGOUT: there was an owner and now there is no session. The cart persists in the DB;
    // the local store goes back to anonymous-empty.
    if (userId === null && owner !== null) {
      // Cancels any pending push of the session being closed.
      if (debounceRef.current) clearTimeout(debounceRef.current);
      ultimaFirmaEnviada.current = null;
      useCartStore.getState().resetear();
      return;
    }

    // From here on userId !== null.
    if (userId !== null && owner === userId) {
      // SAME SESSION: we do not merge. The base signature is set by EFFECT 2 (push).
      // We seed the current signature as "already known" so that the first push
      // does not needlessly resend a state that is already in the DB.
      if (ultimaFirmaEnviada.current === null) {
        ultimaFirmaEnviada.current = firma(useCartStore.getState().items);
      }

      // If the local cart is empty (e.g. localStorage cleared while the
      // session cookie is still alive, or another device), we seed from the DB.
      // Without this, the first replace-all push would EMPTY the DB cart.
      // If there are local items, local wins (this device has the most
      // recent state) and the normal push of EFFECT 2 reconciles.
      if (useCartStore.getState().items.length === 0) {
        let canceladoCarga = false;
        void (async () => {
          try {
            const res = await obtenerCarrito();
            if (canceladoCarga || !res.ok || res.items.length === 0) return;
            // Only if it is still empty: the user may have added something during the fetch.
            if (useCartStore.getState().items.length === 0) {
              const nuevos = res.items.map(aItemStore);
              useCartStore.getState().setAll(nuevos, userId);
              ultimaFirmaEnviada.current = firma(nuevos);
            }
          } catch (error) {
            if (!canceladoCarga) {
              console.warn("[CartSync] No se pudo cargar el carrito de la DB:", error);
            }
          }
        })();
        return () => {
          canceladoCarga = true;
        };
      }
      return;
    }

    // LOGIN or ACCOUNT SWITCH: owner (null or another user) ≠ current userId.
    // Merges the local cart with the DB one; the result replaces both.
    // Idempotent under StrictMode: if a merge is already in progress, it does not relaunch.
    if (fusionEnCurso.current) return;
    fusionEnCurso.current = true;
    let cancelado = false;

    // Returns true if it was settled (success or definitive failure); false if the
    // failure warrants a retry.
    const intentarFusion = async (): Promise<boolean> => {
      try {
        const itemsLocales = aPayloadPlano(useCartStore.getState().items);
        const res = await fusionarCarrito(itemsLocales);
        if (cancelado) return true;

        if (res.ok) {
          const nuevos = res.items.map(aItemStore);
          useCartStore.getState().setAll(nuevos, userId);
          ultimaFirmaEnviada.current = firma(nuevos);
          return true;
        }
        // Logical failure on the server: it warrants a retry (we do not lose the local cart).
        console.warn("[CartSync] Fusión de carrito falló:", res.error);
        return false;
      } catch (error) {
        if (!cancelado) {
          console.warn("[CartSync] Error inesperado al fusionar el carrito:", error);
        }
        return false;
      }
    };

    void (async () => {
      const ok = await intentarFusion();
      if (ok || cancelado) {
        fusionEnCurso.current = false;
        return;
      }
      // Single retry after 2s; the local cart is kept intact in the meantime.
      reintentoRef.current = setTimeout(() => {
        reintentoRef.current = null;
        void (async () => {
          const reintentado = await intentarFusion();
          if (!reintentado && !cancelado) {
            // TODO(toast): tell the user that their cart was not synchronized with
            // their account (it is kept locally and will be retried on the next login).
            console.warn(
              "[CartSync] No se pudo fusionar el carrito tras reintentar; queda local.",
            );
          }
          fusionEnCurso.current = false;
        })();
      }, REINTENTO_FUSION_MS);
    })();

    return () => {
      cancelado = true;
      fusionEnCurso.current = false;
      if (reintentoRef.current) {
        clearTimeout(reintentoRef.current);
        reintentoRef.current = null;
      }
    };
  }, [userId]);

  // ── EFFECT 2: debounced push of the store to the DB (active session only) ────
  React.useEffect(() => {
    if (userId === null) return;

    const empujar = (items: CartItem[]): void => {
      // We only push if the cart already belongs to this user (merge completed).
      if (useCartStore.getState().owner !== userId) return;

      const firmaActual = firma(items);
      if (firmaActual === ultimaFirmaEnviada.current) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void (async () => {
          const payload = aPayloadPlano(items);
          // We mark it as sent BEFORE the await so as not to relaunch the same
          // state if another identical notification arrives while it is in flight.
          ultimaFirmaEnviada.current = firmaActual;
          const res = await sincronizarCarrito(payload);
          if (!res.ok) {
            // It could not persist: allows a retry on the next change.
            ultimaFirmaEnviada.current = null;
            console.warn("[CartSync] No se pudo sincronizar el carrito:", res.error);
          }
        })();
      }, DEBOUNCE_MS);
    };

    // Subscription to changes in the store's items.
    const unsubscribe = useCartStore.subscribe((state) => empujar(state.items));

    return () => {
      unsubscribe();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [userId]);

  return null;
}
