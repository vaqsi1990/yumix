"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/components/auth-context";
import { FavoritesProvider } from "@/components/favorites-context";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider>{children}</FavoritesProvider>
    </AuthProvider>
  );
}
