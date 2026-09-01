"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-context";
import { CartProvider } from "@/components/cart-context";
import CartNotice from "@/components/shop/CartNotice";
import { FavoritesProvider } from "@/components/favorites-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          {children}
          <CartNotice />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
