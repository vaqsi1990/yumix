"use client";

import { useEffect, useState } from "react";
import type { PublicAddOn } from "@/lib/shop-api";

export function useRestaurantAddOns(slug: string | null | undefined) {
  const [addOns, setAddOns] = useState<PublicAddOn[]>([]);

  useEffect(() => {
    if (!slug) {
      setAddOns([]);
      return;
    }

    let cancelled = false;

    void fetch(`/api/backend/shop/restaurants/${encodeURIComponent(slug)}/addons`)
      .then(async (res) => {
        if (!res.ok) return { addOns: [] as PublicAddOn[] };
        return res.json() as Promise<{ addOns?: PublicAddOn[] }>;
      })
      .then((data) => {
        if (!cancelled) setAddOns(data.addOns ?? []);
      })
      .catch(() => {
        if (!cancelled) setAddOns([]);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return addOns;
}
