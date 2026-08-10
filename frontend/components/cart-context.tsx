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
import { fetchCartSummary, countCartLineItems } from "@/lib/shop-api";

type CartContextValue = {
  itemCount: number;
  ready: boolean;
  refresh: () => Promise<void>;
  setItemCount: (count: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [itemCount, setItemCount] = useState(0);
  const [ready, setReady] = useState(false);

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

  useEffect(() => {
    if (status === "loading") return;
    setReady(false);
    void refresh();
  }, [status, refresh]);

  const value = useMemo(
    () => ({
      itemCount,
      ready,
      refresh,
      setItemCount,
    }),
    [itemCount, ready, refresh],
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
