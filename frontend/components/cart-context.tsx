"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-context";
import {
  CART_REPLACED_NOTICE,
  cartWasReplaced,
  fetchCartSummary,
  parseCartSummary,
  type CartSummary,
} from "@/lib/shop-api";

const EMPTY_CART_SUMMARY: CartSummary = {
  itemCount: 0,
  totalQuantity: 0,
  subtotal: 0,
  restaurantId: null,
  restaurantSlug: null,
};

type CartContextValue = CartSummary & {
  ready: boolean;
  notice: string | null;
  refresh: () => Promise<void>;
  setItemCount: (count: number) => void;
  applyCartResponse: (data: unknown) => boolean;
  showNotice: (message: string) => void;
  clearNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [summary, setSummary] = useState<CartSummary>(EMPTY_CART_SUMMARY);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY_CART_SUMMARY);
      setReady(true);
      return;
    }

    try {
      const data = await fetchCartSummary();
      setSummary(data);
    } catch {
      setSummary(EMPTY_CART_SUMMARY);
    } finally {
      setReady(true);
    }
  }, [user]);

  const applyCartResponse = useCallback(
    (data: unknown) => {
      setSummary(parseCartSummary(data as Parameters<typeof parseCartSummary>[0]));
      void refresh();

      if (cartWasReplaced(data)) {
        setNotice(CART_REPLACED_NOTICE);
        return true;
      }

      return false;
    },
    [refresh],
  );

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
  }, []);

  const setItemCount = useCallback((count: number) => {
    setSummary((prev) =>
      prev.itemCount === count ? prev : { ...prev, itemCount: count },
    );
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    setReady(false);
    void refresh();
  }, [status, refresh]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const value = useMemo(
    () => ({
      ...summary,
      ready,
      notice,
      refresh,
      setItemCount,
      applyCartResponse,
      showNotice,
      clearNotice,
    }),
    [summary, ready, notice, refresh, setItemCount, applyCartResponse, showNotice, clearNotice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

export function syncCartFromResponse(data: unknown) {
  return parseCartSummary(
    data as Parameters<typeof parseCartSummary>[0],
  ).itemCount;
}
