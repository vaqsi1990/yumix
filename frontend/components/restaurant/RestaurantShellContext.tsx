"use client";

import { createContext, useContext } from "react";

type RestaurantShellContextValue = {
  hasIban: boolean;
};

const RestaurantShellContext = createContext<RestaurantShellContextValue>({
  hasIban: true,
});

export function RestaurantShellProvider({
  hasIban,
  children,
}: {
  hasIban: boolean;
  children: React.ReactNode;
}) {
  return (
    <RestaurantShellContext.Provider value={{ hasIban }}>
      {children}
    </RestaurantShellContext.Provider>
  );
}

export function useRestaurantShell() {
  return useContext(RestaurantShellContext);
}
