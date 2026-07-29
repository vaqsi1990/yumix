"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseApiError } from "@/lib/admin/api";
import { formatGel } from "@/lib/admin/format";
import type { AdminProduct } from "@/components/admin/products/types";
import {
  AVAILABILITY_BADGE,
  AVAILABILITY_LABELS,
} from "@/components/admin/products/types";

type MenuCategory = {
  id: string;
  name: string;
  sortOrder: number;
  products: AdminProduct[];
};

type RestaurantMenuPanelProps = {
  restaurantId: string;
  restaurantName: string;
  isApproved: boolean;
};

export default function RestaurantMenuPanel({
  restaurantId,
  restaurantName,
  isApproved,
}: RestaurantMenuPanelProps) {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );

  const returnTo = `/admin/restaurants/${restaurantId}?tab=menu`;

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const menuRes = await fetch(
        `/api/backend/admin/restaurants/${restaurantId}/menu`,
      );
      if (menuRes.ok) {
        const data = (await menuRes.json()) as { menu: MenuCategory[] };
        setMenu(data.menu);
        return;
      }

      const [categoriesRes, productsRes] = await Promise.all([
        fetch(
          `/api/backend/admin/product-categories?restaurantId=${restaurantId}`,
        ),
        fetch("/api/backend/admin/products"),
      ]);

      if (!categoriesRes.ok || !productsRes.ok) {
        const failedRes = !categoriesRes.ok ? categoriesRes : productsRes;
        setError(
          await parseApiError(failedRes, "მენიუს ჩატვირთვა ვერ მოხერხდა"),
        );
        return;
      }

      const categoriesData = (await categoriesRes.json()) as {
        categories: Array<{
          id: string;
          name: string;
          sortOrder: number;
        }>;
      };
      const productsData = (await productsRes.json()) as {
        products: AdminProduct[];
      };

      const products = productsData.products.filter(
        (product) => product.restaurantId === restaurantId,
      );

      setMenu(
        categoriesData.categories.map((category) => ({
          ...category,
          products: products
            .filter((product) => product.categoryId === category.id)
            .sort((a, b) => a.name.localeCompare(b.name, "ka")),
        })),
      );
    } catch {
      setError("მენიუს ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const totalProducts = menu.reduce(
    (sum, category) => sum + category.products.length,
    0,
  );

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    setError("");
    try {
      const res = await fetch("/api/backend/admin/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          name: newCategoryName.trim(),
          sortOrder: menu.length,
        }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "კატეგორიის შექმნა ვერ მოხერხდა"));
        return;
      }
      setNewCategoryName("");
      await loadMenu();
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleRenameCategory(categoryId: string) {
    if (!editingCategoryName.trim()) return;
    setSavingCategoryId(categoryId);
    setError("");
    try {
      const res = await fetch(
        `/api/backend/admin/product-categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editingCategoryName.trim() }),
        },
      );
      if (!res.ok) {
        setError(await parseApiError(res, "კატეგორიის განახლება ვერ მოხერხდა"));
        return;
      }
      setEditingCategoryId(null);
      setEditingCategoryName("");
      await loadMenu();
    } finally {
      setSavingCategoryId(null);
    }
  }

  async function handleMoveCategory(categoryId: string, direction: "up" | "down") {
    const index = menu.findIndex((c) => c.id === categoryId);
    if (index < 0) return;
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= menu.length) return;

    const current = menu[index];
    const swap = menu[swapIndex];
    setSavingCategoryId(categoryId);
    setError("");

    try {
      const [resA, resB] = await Promise.all([
        fetch(`/api/backend/admin/product-categories/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: swap.sortOrder }),
        }),
        fetch(`/api/backend/admin/product-categories/${swap.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: current.sortOrder }),
        }),
      ]);
      if (!resA.ok || !resB.ok) {
        setError("კატეგორიების დალაგება ვერ მოხერხდა");
        return;
      }
      await loadMenu();
    } finally {
      setSavingCategoryId(null);
    }
  }

  async function handleDeleteCategory(category: MenuCategory) {
    if (category.products.length > 0) {
      window.alert(
        `"${category.name}" შეიცავს ${category.products.length} პროდუქტს. ჯერ წაშალე ან გადაიტანე ისინი.`,
      );
      return;
    }
    if (!window.confirm(`"${category.name}" წავშალოთ?`)) return;

    const res = await fetch(
      `/api/backend/admin/product-categories/${category.id}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      window.alert(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
      return;
    }
    await loadMenu();
  }

  async function handleDeleteProduct(product: AdminProduct) {
    if (!window.confirm(`"${product.name}" წავშალოთ?`)) return;
    setDeletingProductId(product.id);
    try {
      const res = await fetch(`/api/backend/admin/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        window.alert(await parseApiError(res, "წაშლა ვერ მოხერხდა"));
        return;
      }
      await loadMenu();
    } finally {
      setDeletingProductId(null);
    }
  }

  function productAddHref(categoryId: string) {
    const params = new URLSearchParams({
      restaurantId,
      returnTo,
    });
    if (categoryId) params.set("categoryId", categoryId);
    return `/admin/products/new?${params.toString()}`;
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
    <div className="space-y-4">
      {!isApproved && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[16px] md:text-[18px] text-amber-900">
          <p className="font-semibold">რესტორანი ჯერ არ არის დამტკიცებული</p>
          <p className="mt-1 text-amber-800/90">
            მენიუს შექმნა შეგიძლია, მაგრამ მომხმარებლებს მაღაზიაში არ
            გამოჩნდება, სანამ დამტკიცებას არ მიიღებს.
          </p>
        </div>
      )}

      <Card>
        <CardContent className="space-y-4 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">
                {restaurantName} — მენიუ
              </h3>
              <p className="text-[16px] md:text-[18px] text-muted-foreground">
                {menu.length} კატეგორია · {totalProducts} პროდუქტი
              </p>
            </div>
            <Link
              href={productAddHref("")}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[16px] font-medium text-primary-foreground hover:bg-primary/90 md:text-[18px]"
            >
              <Plus className="size-4" />
              პროდუქტის დამატება
            </Link>
          </div>

          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            1. შექმენი მენიუს კატეგორიები (პიცა, სალათები...) · 2. დაამატე
            პროდუქტები თითოეულ კატეგორიაში
          </p>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[16px] md:text-[18px] text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="ახალი კატეგორია, მაგ: პიცა"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateCategory();
                }
              }}
            />
            <Button
              type="button"
              className="shrink-0"
              disabled={creatingCategory || !newCategoryName.trim()}
              onClick={() => void handleCreateCategory()}
            >
              <Plus className="size-4" />
              კატეგორია
            </Button>
          </div>
        </CardContent>
      </Card>

      {menu.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              მენიუს კატეგორიები ჯერ არ არის
            </p>
            <p className="mt-2 text-[16px] md:text-[18px] text-muted-foreground">
              დაამატე პირველი კატეგორია (მაგ: პიცა, სალათები, სასმელები)
            </p>
          </CardContent>
        </Card>
      ) : (
        menu.map((category, index) => (
          <Card key={category.id}>
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {editingCategoryId === category.id ? (
                    <div className="flex min-w-0 flex-1 gap-2">
                      <Input
                        value={editingCategoryName}
                        onChange={(e) =>
                          setEditingCategoryName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void handleRenameCategory(category.id);
                          }
                          if (e.key === "Escape") {
                            setEditingCategoryId(null);
                            setEditingCategoryName("");
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingCategoryId === category.id}
                        onClick={() => void handleRenameCategory(category.id)}
                      >
                        შენახვა
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                        }}
                      >
                        გაუქმება
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h4 className="truncate text-lg font-bold text-neutral-900">
                        {category.name}
                      </h4>
                      <span className="shrink-0 text-[16px] text-muted-foreground md:text-[18px]">
                        {category.products.length} პროდუქტი
                      </span>
                    </>
                  )}
                </div>

                {editingCategoryId !== category.id && (
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={index === 0 || savingCategoryId === category.id}
                      aria-label="ზემოთ"
                      onClick={() => void handleMoveCategory(category.id, "up")}
                    >
                      <ChevronUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={
                        index === menu.length - 1 ||
                        savingCategoryId === category.id
                      }
                      aria-label="ქვემოთ"
                      onClick={() =>
                        void handleMoveCategory(category.id, "down")
                      }
                    >
                      <ChevronDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="სახელის შეცვლა"
                      onClick={() => {
                        setEditingCategoryId(category.id);
                        setEditingCategoryName(category.name);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="წაშლა"
                      onClick={() => void handleDeleteCategory(category)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                    <Button type="button" size="sm" asChild>
                      <Link href={productAddHref(category.id)}>
                        <Plus className="size-4" />
                        პროდუქტი
                      </Link>
                    </Button>
                  </div>
                )}
              </div>

              {category.products.length === 0 ? (
                <div className="rounded-xl border border-dashed py-8 text-center">
                  <p className="text-[16px] md:text-[18px] text-muted-foreground">
                    ამ კატეგორიაში პროდუქტები არ არის
                  </p>
                  <Button type="button" size="sm" className="mt-3" asChild>
                    <Link href={productAddHref(category.id)}>
                      <Plus className="size-4" />
                      პირველი პროდუქტის დამატება
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y rounded-xl border">
                  {category.products.map((product) => (
                    <li
                      key={product.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[16px] text-muted-foreground">
                              —
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-neutral-900">
                            {product.name}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="text-[16px] font-semibold tabular-nums md:text-[18px]">
                              {formatGel(
                                product.discountPrice != null &&
                                  product.discountPrice > 0
                                  ? product.discountPrice
                                  : product.price,
                              )}
                            </span>
                            {product.discountPrice != null &&
                              product.discountPrice > 0 && (
                                <span className="text-[16px] text-muted-foreground line-through md:text-[18px]">
                                  {formatGel(product.price)}
                                </span>
                              )}
                            <Badge variant={AVAILABILITY_BADGE[product.availability]}>
                              {AVAILABILITY_LABELS[product.availability]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                        <Button type="button" variant="ghost" size="sm" asChild>
                          <Link
                            href={`/admin/products/${product.id}/edit?returnTo=${encodeURIComponent(returnTo)}`}
                          >
                            <Pencil className="size-4" />
                            რედაქტირება
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={deletingProductId === product.id}
                          aria-label="წაშლა"
                          onClick={() => void handleDeleteProduct(product)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
