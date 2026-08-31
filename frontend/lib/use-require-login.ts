"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-context";

export function useRequireLogin() {
  const router = useRouter();
  const { user, status } = useAuth();

  const requireLogin = useCallback(() => {
    if (status === "loading") return "loading" as const;
    if (!user) {
      const next = `${window.location.pathname}${window.location.search}`;
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return false;
    }
    return true;
  }, [user, status, router]);

  return {
    user,
    status,
    authReady: status !== "loading",
    isLoggedIn: status === "authenticated" && !!user,
    requireLogin,
  };
}
