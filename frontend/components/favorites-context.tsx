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
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";
import {
  addFavoriteProduct,
  addFavoriteRestaurant,
  fetchFavoritesSummary,
  removeFavoriteProduct,
  removeFavoriteRestaurant,
} from "@/lib/account-api";

type FavoritesContextValue = {
  restaurantIds: Set<string>;
  productIds: Set<string>;
  ready: boolean;
  isRestaurantFavorite: (id: string) => boolean;
  isProductFavorite: (id: string) => boolean;
  toggleRestaurant: (id: string) => Promise<boolean>;
  toggleProduct: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, status } = useAuth();
  const [restaurantIds, setRestaurantIds] = useState<Set<string>>(new Set());
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== "USER") {
      setRestaurantIds(new Set());
      setProductIds(new Set());
      setReady(true);
      return;
    }

    try {
      const data = await fetchFavoritesSummary();
      setRestaurantIds(new Set(data.restaurantIds));
      setProductIds(new Set(data.productIds));
    } catch {
      setRestaurantIds(new Set());
      setProductIds(new Set());
    } finally {
      setReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (status === "loading") return;
    setReady(false);
    void refresh();
  }, [status, refresh]);

  const ensureUser = useCallback(() => {
    if (!user) {
      router.push("/login");
      return false;
    }
    if (user.role !== "USER") {
      return false;
    }
    return true;
  }, [router, user]);

  const toggleRestaurant = useCallback(
    async (restaurantId: string) => {
      if (!ensureUser()) return false;

      const wasFavorite = restaurantIds.has(restaurantId);
      setRestaurantIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(restaurantId);
        else next.add(restaurantId);
        return next;
      });

      try {
        if (wasFavorite) {
          await removeFavoriteRestaurant(restaurantId);
        } else {
          await addFavoriteRestaurant(restaurantId);
        }
        return !wasFavorite;
      } catch {
        setRestaurantIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(restaurantId);
          else next.delete(restaurantId);
          return next;
        });
        return wasFavorite;
      }
    },
    [ensureUser, restaurantIds],
  );

  const toggleProduct = useCallback(
    async (productId: string) => {
      if (!ensureUser()) return false;

      const wasFavorite = productIds.has(productId);
      setProductIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.delete(productId);
        else next.add(productId);
        return next;
      });

      try {
        if (wasFavorite) {
          await removeFavoriteProduct(productId);
        } else {
          await addFavoriteProduct(productId);
        }
        return !wasFavorite;
      } catch {
        setProductIds((prev) => {
          const next = new Set(prev);
          if (wasFavorite) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return wasFavorite;
      }
    },
    [ensureUser, productIds],
  );

  const value = useMemo(
    () => ({
      restaurantIds,
      productIds,
      ready,
      isRestaurantFavorite: (id: string) => restaurantIds.has(id),
      isProductFavorite: (id: string) => productIds.has(id),
      toggleRestaurant,
      toggleProduct,
      refresh,
    }),
    [
      restaurantIds,
      productIds,
      ready,
      toggleRestaurant,
      toggleProduct,
      refresh,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return ctx;
}
