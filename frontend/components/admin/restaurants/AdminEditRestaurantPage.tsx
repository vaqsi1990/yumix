"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RestaurantFormView from "./RestaurantFormView";
import type { RestaurantOwnerCandidate } from "./form/OwnerUserPicker";
import type { RestaurantFormValues } from "./form-schema";
import type { AdminRestaurant } from "./types";
import {
  mapApiRestaurant,
  parseApiError,
  restaurantToFormValues,
  type ApiRestaurantRow,
} from "./utils";

type AdminEditRestaurantPageProps = {
  restaurantId: string;
  users: RestaurantOwnerCandidate[];
};

export default function AdminEditRestaurantPage({
  restaurantId,
  users,
}: AdminEditRestaurantPageProps) {
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<AdminRestaurant | null | undefined>(
    undefined,
  );
  const [saving, setSaving] = useState(false);
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

  async function handleSubmit(data: RestaurantFormValues) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/backend/admin/restaurants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, id: restaurantId }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "რესტორნის განახლება ვერ მოხერხდა"));
        return;
      }
      router.push(`/admin/restaurants/${restaurantId}`);
      router.refresh();
    } catch {
      setError("რესტორნის განახლება ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push(`/admin/restaurants/${restaurantId}`);
  }

  if (restaurant === undefined) {
    return (
      <p className="text-[16px] md:text-[18px] text-muted-foreground">იტვირთება...</p>
    );
  }

  if (error && restaurant === null) {
    return <p className="text-[16px] md:text-[18px] text-destructive">{error}</p>;
  }

  if (restaurant === null) return null;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-[16px] md:text-[18px] text-destructive">
          {error}
        </div>
      )}
      <RestaurantFormView
        users={users}
        mode="edit"
        initialValues={restaurantToFormValues(restaurant)}
        saving={saving}
        onSubmit={(data) => void handleSubmit(data)}
        onCancel={handleCancel}
      />
    </div>
  );
}
