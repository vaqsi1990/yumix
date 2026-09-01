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
  countCartLineItems,
  fetchCartSummary,
} from "@/lib/shop-api";

type CartContextValue = {
  itemCount: number;
  ready: boolean;
  notice: string | null;
  refresh: () => Promise<void>;
  setItemCount: (count: number) => void;
  applyCartResponse: (data: unknown) => boolean;
  clearNotice: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setItemCount(0);
      setReady(true);
      return;
    }

    try {
      const data = await fetchCartSummary();
      setItemCount(data.itemCount);
    } catch {
      setItemCount(0);
    } finally {
      setReady(true);
    }
  }, [user]);

  const applyCartResponse = useCallback(
    (data: unknown) => {
      setItemCount(syncCartFromResponse(data));
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
      itemCount,
      ready,
      notice,
      refresh,
      setItemCount,
      applyCartResponse,
      clearNotice,
    }),
    [itemCount, ready, notice, refresh, applyCartResponse, clearNotice],
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
  return countCartLineItems(
    data as {
      totals?: { itemCount?: number } | null;
      cart?: { items?: unknown[] | null };
    },
  );
}
