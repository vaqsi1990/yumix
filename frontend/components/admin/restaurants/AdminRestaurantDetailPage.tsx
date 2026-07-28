"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRestaurantById } from "./mock-data";
import RestaurantDetailView from "./RestaurantDetailView";
import type { AdminRestaurant } from "./types";

type AdminRestaurantDetailPageProps = {
  restaurantId: string;
};

export default function AdminRestaurantDetailPage({
  restaurantId,
}: AdminRestaurantDetailPageProps) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<AdminRestaurant | null | undefined>(
    undefined,
  );

  useEffect(() => {
    setRestaurant(getRestaurantById(restaurantId) ?? null);
  }, [restaurantId]);

  useEffect(() => {
    if (restaurant === null) {
      router.replace("/admin/restaurants");
    }
  }, [restaurant, router]);

  if (restaurant === undefined) {
    return (
      <p className="text-sm text-muted-foreground">იტვირთება...</p>
    );
  }

  if (restaurant === null) return null;

  return <RestaurantDetailView restaurant={restaurant} />;
}
