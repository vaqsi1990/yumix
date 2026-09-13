"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-context";
import {
  CART_REPLACED_NOTICE,
  cartWasReplaced,
  clearCart as clearCartApi,
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
  restaurantName: null,
};

type CartContextValue = CartSummary & {
  ready: boolean;
  notice: string | null;
  refresh: () => Promise<void>;
  applyCartResponse: (data: unknown) => boolean;
  showNotice: (message: string) => void;
  clearNotice: () => void;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const [summary, setSummary] = useState<CartSummary>(EMPTY_CART_SUMMARY);
  const summaryRef = useRef(summary);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const refresh = useCallback(async () => {
    if (!user) {
      setSummary(EMPTY_CART_SUMMARY);
      setReady(true);
      return;
    }

    try {
      const data = await fetchCartSummary(summaryRef.current);
      setSummary(data);
    } catch {
      // Keep last known summary so a transient failure does not show an empty badge.
    } finally {
      setReady(true);
    }
  }, [user]);

  const applyCartResponse = useCallback(
    (data: unknown) => {
      const next = parseCartSummary(
        data as Parameters<typeof parseCartSummary>[0],
      );
      setSummary(next);

      if (cartWasReplaced(data)) {
        setNotice(CART_REPLACED_NOTICE);
        return true;
      }

      return false;
    },
    [],
  );

  const clearCart = useCallback(async () => {
    await clearCartApi();
    setSummary(EMPTY_CART_SUMMARY);
    setNotice(null);
  }, []);

  const clearNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const showNotice = useCallback((message: string) => {
    setNotice(message);
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
      applyCartResponse,
      showNotice,
      clearNotice,
      clearCart,
    }),
    [summary, ready, notice, refresh, applyCartResponse, showNotice, clearNotice, clearCart],
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

export function syncCartFromResponse(data: unknown): CartSummary {
  return parseCartSummary(
    data as Parameters<typeof parseCartSummary>[0],
  );
}
