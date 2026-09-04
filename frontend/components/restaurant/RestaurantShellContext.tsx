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
import MissingIbanBanner from "./MissingIbanBanner";

type RestaurantShellContextValue = {
  hasIban: boolean;
  setHasIban: (value: boolean) => void;
  refreshHasIban: () => Promise<boolean>;
};

const RestaurantShellContext = createContext<RestaurantShellContextValue | null>(
  null,
);

export function RestaurantShellProvider({
  initialHasIban,
  children,
}: {
  initialHasIban: boolean;
  children: ReactNode;
}) {
  const [hasIban, setHasIban] = useState(initialHasIban);

  useEffect(() => {
    setHasIban(initialHasIban);
  }, [initialHasIban]);

  const refreshHasIban = useCallback(async () => {
    try {
      const res = await fetch("/api/backend/restaurant/shell", {
        cache: "no-store",
      });
      if (!res.ok) return false;
      const data = (await res.json()) as {
        hasRestaurant?: boolean;
        restaurant?: { hasIban?: boolean };
      };
      const next =
        data.hasRestaurant === true && data.restaurant?.hasIban === true;
      setHasIban(next);
      return next;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      hasIban,
      setHasIban,
      refreshHasIban,
    }),
    [hasIban, refreshHasIban],
  );

  return (
    <RestaurantShellContext.Provider value={value}>
      {children}
    </RestaurantShellContext.Provider>
  );
}

export function useRestaurantShell() {
  const ctx = useContext(RestaurantShellContext);
  if (!ctx) {
    throw new Error("useRestaurantShell must be used within RestaurantShellProvider");
  }
  return ctx;
}

export function RestaurantShellIbanBanner() {
  const { hasIban } = useRestaurantShell();
  if (hasIban) return null;
  return <MissingIbanBanner />;
}
