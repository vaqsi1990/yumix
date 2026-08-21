"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { onlyStandardMenuCategories } from "@/lib/menu-category-order";

type MenuCategory = {
  id: string;
  restaurantId: string;
  name: string;
  sortOrder: number;
  _count?: { products: number };
};

type RestaurantMenuCategoriesPanelProps = {
  restaurantId: string;
};

export default function RestaurantMenuCategoriesPanel({
  restaurantId,
}: RestaurantMenuCategoriesPanelProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/backend/admin/product-categories?restaurantId=${restaurantId}`,
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { categories: MenuCategory[] };
      setCategories(onlyStandardMenuCategories(data.categories));
    } catch {
      setError("კატეგორიების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          იტვირთება...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-6">
        <p className="text-[16px] md:text-[18px] text-muted-foreground">
          კატეგორიები ფიქსირებულია. პროდუქტები დაამატე მენიუდან.
        </p>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[16px] md:text-[18px] text-destructive">
            {error}
          </p>
        )}

        <ul className="divide-y rounded-xl border">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <p className="font-medium">{category.name}</p>
              <p className="text-[16px] md:text-[18px] text-muted-foreground">
                {category._count?.products ?? 0} პროდუქტი
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
