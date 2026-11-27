import { create } from 'zustand';

import { clampQuantity, type CartQuantities } from './cart-logic';

type CartState = {
  quantities: CartQuantities;
  addItem: (productId: string, stockQty: number) => void;
  setQuantity: (productId: string, quantity: number, stockQty: number) => void;
  removeItems: (productIds: string[]) => void;
};

function withQuantity(quantities: CartQuantities, productId: string, quantity: number) {
  const { [productId]: _removed, ...rest } = quantities;
  return quantity > 0 ? { ...rest, [productId]: quantity } : rest;
}

export const useCartStore = create<CartState>((set) => ({
  quantities: {},
  addItem: (productId, stockQty) =>
    set(({ quantities }) => ({
      quantities: withQuantity(
        quantities,
        productId,
        clampQuantity((quantities[productId] ?? 0) + 1, stockQty),
      ),
    })),
  setQuantity: (productId, quantity, stockQty) =>
    set(({ quantities }) => ({
      quantities: withQuantity(quantities, productId, clampQuantity(quantity, stockQty)),
    })),
  removeItems: (productIds) =>
    set(({ quantities }) => ({
      quantities: Object.fromEntries(
        Object.entries(quantities).filter(([id]) => !productIds.includes(id)),
      ),
    })),
}));

export function useCartCount(): number {
  return useCartStore(({ quantities }) =>
    Object.values(quantities).reduce((total, quantity) => total + quantity, 0),
  );
}
