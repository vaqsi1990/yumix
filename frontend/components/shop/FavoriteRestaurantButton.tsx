"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import {
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
} from "@/lib/account-api";
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
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!user || user.role !== "USER") return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      if (active) {
        await removeFavoriteRestaurant(restaurantId);
        setActive(false);
      } else {
        await addFavoriteRestaurant(restaurantId);
        setActive(true);
      }
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      aria-label={active ? "რჩეულებიდან წაშლა" : "რჩეულებში დამატება"}
      disabled={busy}
      onClick={(e) => void toggle(e)}
      className={cn(
        "relative z-20 rounded-full bg-black/30 p-1.5 text-white backdrop-blur transition hover:scale-105",
        className,
      )}
    >
      <Heart
        className={cn("size-6", active && "fill-[#FF0050] text-[#FF0050]")}
      />
    </button>
  );
}
