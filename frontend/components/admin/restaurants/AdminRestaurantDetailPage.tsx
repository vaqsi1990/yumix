"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantDetailView from "./RestaurantDetailView";
import type { AdminRestaurant } from "./types";
import { mapApiRestaurant, type ApiRestaurantRow } from "./utils";

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
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await fetch(`/api/backend/admin/restaurants/${restaurantId}`);
        if (!res.ok) {
          setRestaurant(null);
          return;
        }
        const data = (await res.json()) as { restaurant: ApiRestaurantRow };
        setRestaurant(mapApiRestaurant(data.restaurant));
      } catch {
        setError("რესტორნის ჩატვირთვა ვერ მოხერხდა");
        setRestaurant(null);
      }
    }
    void load();
  }, [restaurantId]);

  useEffect(() => {
    if (restaurant === null && !error) {
      router.replace("/admin/restaurants");
    }
  }, [restaurant, error, router]);

  if (restaurant === undefined) {
    return (
      <p className="text-[16px] md:text-[18px] text-muted-foreground">იტვირთება...</p>
    );
  }

  if (error) {
    return <p className="text-[16px] md:text-[18px] text-destructive">{error}</p>;
  }

  if (restaurant === null) return null;

  return (
    <RestaurantDetailView
      restaurant={restaurant}
      onRestaurantUpdated={setRestaurant}
    />
  );
}
