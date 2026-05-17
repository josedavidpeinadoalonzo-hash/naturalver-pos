"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { Product, ProductPresentation } from "@/lib/models";

export interface CartItem {
  product: Product;
  presentation: ProductPresentation;
  quantity: number;
  discount?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, presentation: ProductPresentation) => void;
  updateQuantity: (index: number, qty: number) => void;
  removeItem: (index: number) => void;
  setItemDiscount: (index: number, discount: number) => void;
  clearCart: () => void;
  totalUSD: number;
  totalItems: number;
  globalDiscount: number;
  setGlobalDiscount: (amount: number) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);

  const addItem = useCallback((product: Product, presentation: ProductPresentation) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.product.id === product.id && i.presentation.id === presentation.id
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, presentation, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((index: number, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((_, i) => i !== index);
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setItemDiscount = useCallback((index: number, discount: number) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], discount };
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setGlobalDiscount(0);
  }, []);

  const totalUSD = useMemo(() => {
    const subtotal = items.reduce((sum, i) => {
      const unitPrice = i.presentation.priceUSD - (i.discount || 0);
      return sum + Math.max(0, unitPrice) * i.quantity;
    }, 0);
    return Math.max(0, subtotal - globalDiscount);
  }, [items, globalDiscount]);

  const totalItems = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, setItemDiscount, clearCart, totalUSD, totalItems, globalDiscount, setGlobalDiscount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
