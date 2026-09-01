"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/restaurant/PageHeader";
import RestaurantAddonsPanel from "@/components/admin/restaurants/RestaurantAddonsPanel";
import { restaurantApi } from "@/lib/restaurant/api";

const ownerAddonApi = {
  list: "/api/backend/restaurant/addons",
  create: "/api/backend/restaurant/addons",
  update: (id: string) => `/api/backend/restaurant/addons/${id}`,
  delete: (id: string) => `/api/backend/restaurant/addons/${id}`,
};

export default function RestaurantAddonsPage() {
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    void restaurantApi
      .dashboard()
      .then((data) => setRestaurantId(data.restaurant.id))
      .catch(() => setRestaurantId(null));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="დამატებები"
        description="დაამატე სასმელები და დამატებითი კერძები, რომ მომხმარებელმა შეკვეთისას აირჩიოს."
      />
      {restaurantId ? (
        <RestaurantAddonsPanel restaurantId={restaurantId} api={ownerAddonApi} />
      ) : (
        <p className="py-12 text-center text-muted-foreground">იტვირთება...</p>
      )}
    </div>
  );
}
