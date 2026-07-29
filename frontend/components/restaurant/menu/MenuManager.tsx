"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import MenuCategoryDialog from "@/components/restaurant/menu/MenuCategoryDialog";
import ProductDialog from "@/components/restaurant/products/ProductDialog";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import CardGridSkeleton from "@/components/restaurant/skeletons/CardGridSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { restaurantApi } from "@/lib/restaurant/api";
import { formatCurrency } from "@/lib/restaurant/format";
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

export default function MenuManager() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(
    null,
  );
  const [deleteCategoryTarget, setDeleteCategoryTarget] =
    useState<MenuCategory | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RestaurantProduct | null>(
    null,
  );
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>();
  const [deleteProductTarget, setDeleteProductTarget] =
    useState<RestaurantProduct | null>(null);

  const loadMenu = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.menu();
      setCategories(normalizeMenuCategories(res.menu ?? []));
      setProductCategories(normalizeProductCategories(res.categories));
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

  async function handleSaveCategory(data: {
    name: string;
    description?: string;
    image?: string;
    visible: boolean;
    sortOrder: number;
  }) {
    try {
      if (editingCategory) {
        await restaurantApi.updateCategory(editingCategory.id, {
          name: data.name,
          sortOrder: data.sortOrder,
        });
      } else {
        await restaurantApi.createCategory({
          name: data.name,
          sortOrder: data.sortOrder,
        });
      }
      await loadMenu();
      setEditingCategory(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    if (deleteCategoryTarget.productsCount > 0) {
      alert(
        KA.menu.deleteCategoryBlocked
          .replace("{name}", deleteCategoryTarget.name)
          .replace("{count}", String(deleteCategoryTarget.productsCount)),
      );
      setDeleteCategoryTarget(null);
      return;
    }
    try {
      await restaurantApi.deleteCategory(deleteCategoryTarget.id);
      await loadMenu();
      setDeleteCategoryTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    }
  }

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

  function openCreateProduct(categoryId: string) {
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
          <Button
            onClick={() => {
              setEditingCategory(null);
              setCategoryDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
             {KA.menu.createCategory}
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={KA.menu.empty}
          description={KA.menu.emptyDesc}
          actionLabel={KA.menu.createCategory}
          onAction={() => setCategoryDialogOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
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
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryDialogOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                      {KA.edit}
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteCategoryTarget(category)}
                    >
                      <Trash2 className="size-4" />
                      {KA.delete}
                    </Button>
                  </div>
                </div>

                {(category.products ?? []).length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                    <p className="font-medium text-foreground">
                      {KA.menu.noProducts}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {KA.menu.noProductsDesc}
                    </p>
                    <Button
                      className="mt-4"
                      size="sm"
                      variant="outline"
                      onClick={() => openCreateProduct(category.id)}
                    >
                      <Plus className="size-4" />
                      {KA.menu.addProduct}
                    </Button>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MenuCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={productCategories}
        defaultCategoryId={defaultCategoryId}
        onSave={handleSaveProduct}
      />

      <ConfirmDialog
        open={!!deleteCategoryTarget}
        onOpenChange={(open) => !open && setDeleteCategoryTarget(null)}
        title={KA.menu.deleteTitle}
        description={
          deleteCategoryTarget
            ? KA.menu.deleteDesc.replace("{name}", deleteCategoryTarget.name)
            : ""
        }
        confirmLabel={KA.delete}
        variant="destructive"
        onConfirm={handleDeleteCategory}
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
