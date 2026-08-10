"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useFavorites } from "@/components/favorites-context";
import { cn } from "@/lib/utils";

type FavoriteRestaurantButtonProps = {
  restaurantId: string;
  className?: string;
};

export default function FavoriteRestaurantButton({
  restaurantId,
  className,
}: FavoriteRestaurantButtonProps) {
  const { user } = useAuth();
  const { isRestaurantFavorite, toggleRestaurant, ready } = useFavorites();
  const [busy, setBusy] = useState(false);

  const active = ready && isRestaurantFavorite(restaurantId);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await toggleRestaurant(restaurantId);
    } finally {
      setBusy(false);
    }
  }

  if (user && user.role !== "USER") return null;

  return (
    <button
      type="button"
      aria-label={active ? "რჩეულებიდან წაშლა" : "რჩეულებში დამატება"}
      aria-pressed={active}
      disabled={busy}
      onClick={(e) => void toggle(e)}
      className={cn(
        "relative z-20 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:scale-105 disabled:opacity-60",
        className,
      )}
    >
      <Heart
        className={cn("size-6", active && "fill-[#FF0050] text-[#FF0050]")}
      />
    </button>
  );
}
