"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseApiError } from "@/lib/admin/api";

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
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/backend/admin/product-categories?restaurantId=${restaurantId}`,
      );
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as { categories: MenuCategory[] };
      setCategories(data.categories);
    } catch {
      setError("კატეგორიების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/backend/admin/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          name: newName.trim(),
          sortOrder: categories.length,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "კატეგორიის შექმნა ვერ მოხერხდა"));
        return;
      }
      setNewName("");
      await loadCategories();
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(category: MenuCategory) {
    if (
      !window.confirm(`"${category.name}" წავშალოთ?`)
    ) {
      return;
    }
    const res = await fetch(
      `/api/backend/admin/product-categories/${category.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      window.alert(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
      return;
    }
    await loadCategories();
  }

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
          მენიუს კატეგორიები (პიცა, სალათები, სასმელები...) — პროდუქტების
          დაჯგუფებისთვის.
        </p>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[16px] md:text-[18px] text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="ახალი კატეგორია, მაგ: პიცა"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button
            type="button"
            className="shrink-0"
            disabled={creating || !newName.trim()}
            onClick={() => void handleCreate()}
          >
            <Plus className="size-4" />
            დამატება
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl border border-dashed py-10 text-center text-[16px] md:text-[18px] text-muted-foreground">
            მენიუს კატეგორიები ჯერ არ არის
          </p>
        ) : (
          <ul className="divide-y rounded-xl border">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium">{category.name}</p>
                  <p className="text-[16px] md:text-[18px] text-muted-foreground">
                    {category._count?.products ?? 0} პროდუქტი
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="წაშლა"
                  onClick={() => void handleDelete(category)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
