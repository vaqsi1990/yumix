"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import ProductDialog from "@/components/restaurant/products/ProductDialog";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import CardGridSkeleton from "@/components/restaurant/skeletons/CardGridSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { restaurantApi } from "@/lib/restaurant/api";
import { formatCurrency } from "@/lib/restaurant/format";
import { onlyStandardMenuCategories } from "@/lib/menu-category-order";
import {
  KA,
  PRODUCT_AVAILABILITY_LABELS,
  translateApiError,
} from "@/lib/restaurant/labels";
import type {
  MenuCategory,
  ProductCategory,
  ProductWritePayload,
  RestaurantProduct,
} from "@/lib/restaurant/types";

function normalizeMenuCategories(menu: MenuCategory[]): MenuCategory[] {
  return menu.map((category) => ({
    ...category,
    products: category.products ?? [],
    productsCount:
      category.productsCount ?? category.products?.length ?? 0,
  }));
}

function normalizeProductCategories(
  categories: ProductCategory[] | undefined,
): ProductCategory[] {
  return categories ?? [];
}

function hasCategoryProducts(category: MenuCategory) {
  return (category.productsCount ?? category.products?.length ?? 0) > 0;
}

export default function MenuManager() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RestaurantProduct | null>(
    null,
  );
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>();
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<RestaurantProduct | null>(null);

  const visibleCategories = useMemo(
    () => categories.filter(hasCategoryProducts),
    [categories],
  );

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.menu();
      setCategories(onlyStandardMenuCategories(normalizeMenuCategories(res.menu ?? [])));
      setProductCategories(
        onlyStandardMenuCategories(normalizeProductCategories(res.categories)),
      );
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  async function handleToggleVisibility(category: MenuCategory) {
    try {
      await restaurantApi.toggleMenuVisibility(category.id, !category.visible);
      await loadMenu();
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  function openCreateProduct(categoryId?: string) {
    setEditingProduct(null);
    setDefaultCategoryId(categoryId);
    setProductDialogOpen(true);
  }

  function openEditProduct(product: RestaurantProduct) {
    setEditingProduct(product);
    setDefaultCategoryId(product.categoryId);
    setProductDialogOpen(true);
  }

  async function handleSaveProduct(data: ProductWritePayload) {
    try {
      if (editingProduct) {
        await restaurantApi.updateProduct(editingProduct.id, data);
      } else {
        await restaurantApi.createProduct(data);
      }
      await loadMenu();
      setEditingProduct(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDeleteProduct() {
    if (!deleteProductTarget) return;
    try {
      await restaurantApi.deleteProduct(deleteProductTarget.id);
      await loadMenu();
      setDeleteProductTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.menu.title} description={KA.loading} />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={KA.menu.title}
        description={KA.menu.subtitle}
        actions={
          productCategories.length > 0 ? (
            <Button onClick={() => openCreateProduct()}>
              <Plus className="size-4" />
              {KA.menu.addProduct}
            </Button>
          ) : null
        }
      />

      {visibleCategories.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={KA.menu.noProducts}
          description={KA.menu.noProductsDesc}
          actionLabel={KA.menu.addProduct}
          onAction={() => openCreateProduct()}
        />
      ) : (
        <div className="space-y-4">
          {visibleCategories.map((category) => (
            <Card key={category.id}>
              <CardContent className="space-y-4 py-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      {!category.visible && (
                        <Badge variant="secondary">{KA.hidden}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {category.productsCount} {KA.menu.productsCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => openCreateProduct(category.id)}
                    >
                      <Plus className="size-4" />
                      {KA.menu.addProduct}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleVisibility(category)}
                    >
                      {category.visible ? (
                        <>
                          <EyeOff className="size-4" />
                          {KA.menu.hide}
                        </>
                      ) : (
                        <>
                          <Eye className="size-4" />
                          {KA.menu.show}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="divide-y divide-border rounded-lg border border-border">
                  {(category.products ?? []).map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {product.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.image}
                                alt={product.name}
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                                {KA.noImage}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(product.price)}
                              {product.discountPrice != null &&
                                ` · ${formatCurrency(product.discountPrice)}`}
                            </p>
                            {(product.customizationGroups?.length ?? 0) > 0 ? (
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {product.customizationGroups!
                                  .map((group) => group.name)
                                  .join(" · ")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {
                              PRODUCT_AVAILABILITY_LABELS[
                                product.availability
                              ]
                            }
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditProduct(product)}
                          >
                            <Pencil className="size-4" />
                            {KA.edit}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteProductTarget(product)}
                          >
                            <Trash2 className="size-4" />
                            {KA.delete}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductDialog
        key={editingProduct?.id ?? `new-${defaultCategoryId ?? "none"}`}
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={productCategories}
        defaultCategoryId={defaultCategoryId}
        onSave={handleSaveProduct}
      />

      <ConfirmDialog
        open={!!deleteProductTarget}
        onOpenChange={(open) => !open && setDeleteProductTarget(null)}
        title={KA.products.deleteTitle}
        description={
          deleteProductTarget
            ? KA.products.deleteDesc.replace("{name}", deleteProductTarget.name)
            : ""
        }
        confirmLabel={KA.delete}
        variant="destructive"
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}
