"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useFavorites } from "@/components/favorites-context";
import { cn } from "@/lib/utils";

type FavoriteProductButtonProps = {
  productId: string;
  className?: string;
};

export default function FavoriteProductButton({
  productId,
  className,
}: FavoriteProductButtonProps) {
  const { user } = useAuth();
  const { isProductFavorite, toggleProduct, ready } = useFavorites();
  const [busy, setBusy] = useState(false);

  const active = ready && isProductFavorite(productId);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      await toggleProduct(productId);
    } finally {
      setBusy(false);
    }
  }

  if (user && user.role !== "USER") return null;

  return (
    <button
      type="button"
      aria-label={active ? "რჩეული კერძებიდან წაშლა" : "რჩეულ კერძებში დამატება"}
      aria-pressed={active}
      disabled={busy}
      onClick={() => void toggle()}
      className={cn(
        "rounded-full border border-neutral-200 p-2 text-neutral-500 transition hover:border-[#FF0050] hover:text-[#FF0050] disabled:opacity-60",
        active && "border-[#FF0050] bg-[#FF0050]/10 text-[#FF0050]",
        className,
      )}
    >
      <Heart className={cn("size-5", active && "fill-current")} />
    </button>
  );
}
