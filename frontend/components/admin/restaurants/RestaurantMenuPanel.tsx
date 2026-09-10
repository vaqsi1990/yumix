"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { parseApiError } from "@/lib/admin/api";
import { formatGel } from "@/lib/admin/format";
import { onlyStandardMenuCategories } from "@/lib/menu-category-order";
import type { AdminProduct } from "@/components/admin/products/types";
import {
  APPROVAL_BADGE,
  APPROVAL_LABELS,
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
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [approvalProductId, setApprovalProductId] = useState<string | null>(
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
        setMenu(onlyStandardMenuCategories(data.menu));
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
        onlyStandardMenuCategories(
          categoriesData.categories.map((category) => ({
            ...category,
            products: products
              .filter((product) => product.categoryId === category.id)
              .sort((a, b) => a.name.localeCompare(b.name, "ka")),
          })),
        ),
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

  async function handleApproval(
    product: AdminProduct,
    approvalStatus: "APPROVED" | "REJECTED",
  ) {
    setApprovalProductId(product.id);
    setError("");
    try {
      const res = await fetch(`/api/backend/admin/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      if (!res.ok) {
        setError(await parseApiError(res, "სტატუსის შეცვლა ვერ მოხერხდა"));
        return;
      }
      const data = (await res.json()) as { product: AdminProduct };
      setMenu((prev) =>
        prev.map((category) => ({
          ...category,
          products: category.products.map((row) =>
            row.id === product.id ? data.product : row,
          ),
        })),
      );
    } catch {
      setError("სტატუსის შეცვლა ვერ მოხერხდა");
    } finally {
      setApprovalProductId(null);
    }
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
            კატეგორიები ფიქსირებულია. დაამატე პროდუქტი სასურველ სექციაში.
          </p>

          {error && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[16px] md:text-[18px] text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {menu.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              მენიუს კატეგორიები ჯერ არ არის
            </p>
            <p className="mt-2 text-[16px] md:text-[18px] text-muted-foreground">
              განაახლე გვერდი — კატეგორიები ავტომატურად იქმნება
            </p>
          </CardContent>
        </Card>
      ) : (
        menu.map((category) => (
          <Card key={category.id}>
            <CardContent className="space-y-4 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <h4 className="truncate text-lg font-bold text-neutral-900">
                    {category.name}
                  </h4>
                  <span className="shrink-0 text-[16px] text-muted-foreground md:text-[18px]">
                    {category.products.length} პროდუქტი
                  </span>
                </div>
                <Button type="button" size="sm" asChild>
                  <Link href={productAddHref(category.id)}>
                    <Plus className="size-4" />
                    პროდუქტი
                  </Link>
                </Button>
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
                            <Badge variant={APPROVAL_BADGE[product.approvalStatus]}>
                              {APPROVAL_LABELS[product.approvalStatus]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 self-end sm:self-center">
                        {product.approvalStatus !== "APPROVED" && (
                          <Button
                            type="button"
                            size="sm"
                            disabled={approvalProductId === product.id}
                            onClick={() => void handleApproval(product, "APPROVED")}
                          >
                            <Check className="size-4" />
                            დამტკიცება
                          </Button>
                        )}
                        {product.approvalStatus !== "REJECTED" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={approvalProductId === product.id}
                            onClick={() => void handleApproval(product, "REJECTED")}
                          >
                            <X className="size-4" />
                            უარყოფა
                          </Button>
                        )}
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
