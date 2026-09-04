"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Plus, Search } from "lucide-react";
import PageHeader from "@/components/restaurant/PageHeader";
import ProductsTable from "@/components/restaurant/products/ProductsTable";
import ProductDialog from "@/components/restaurant/products/ProductDialog";
import ConfirmDialog from "@/components/restaurant/ConfirmDialog";
import EmptyState from "@/components/restaurant/EmptyState";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import { onlyStandardMenuCategories, isComboMenuCategory } from "@/lib/menu-category-order";
import type {
  ProductCategory,
  ProductWritePayload,
  RestaurantProduct,
} from "@/lib/restaurant/types";
import { useRestaurantShell } from "@/components/restaurant/RestaurantShellContext";

const PAGE_SIZE = 10;

export default function ProductsManager() {
  const { hasIban } = useRestaurantShell();
  const [products, setProducts] = useState<RestaurantProduct[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialProductKind, setInitialProductKind] = useState<"item" | "combo">(
    "item",
  );
  const [editing, setEditing] = useState<RestaurantProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RestaurantProduct | null>(
    null,
  );

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.products();
      setProducts(res.products);
      setCategories(onlyStandardMenuCategories(res.categories));
    } catch (e) {
      setError(
        translateApiError(e instanceof Error ? e.message : KA.failedLoad),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q),
    );
  }, [products, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleSave(data: ProductWritePayload) {
    try {
      if (editing) {
        await restaurantApi.updateProduct(editing.id, data);
      } else {
        if (!hasIban) return;
        await restaurantApi.createProduct(data);
      }
      await loadProducts();
      setEditing(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDuplicate(product: RestaurantProduct) {
    if (!hasIban) return;
    try {
      await restaurantApi.duplicateProduct(product.id);
      await loadProducts();
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedSave),
      );
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await restaurantApi.deleteProduct(deleteTarget.id);
      await loadProducts();
      setDeleteTarget(null);
    } catch (e) {
      alert(
        translateApiError(e instanceof Error ? e.message : KA.failedDelete),
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.products.title} description={KA.loading} />
        <TableSkeleton rows={6} cols={7} />
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
        title={KA.products.title}
        description={KA.products.subtitle}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                if (!hasIban) return;
                setEditing(null);
                setInitialProductKind("item");
                setDialogOpen(true);
              }}
              disabled={categories.length === 0 || !hasIban}
            >
              <Plus className="size-4" />
              {KA.products.create}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!hasIban) return;
                setEditing(null);
                setInitialProductKind("combo");
                setDialogOpen(true);
              }}
              disabled={!hasIban}
            >
              <Plus className="size-4" />
              {KA.products.createCombo}
            </Button>
          </div>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={KA.products.search}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      {paginated.length === 0 ? (
        <EmptyState
          icon={Package}
          title={KA.products.empty}
          description={
            categories.length === 0
              ? KA.products.emptyNoCategory
              : KA.products.emptySearch
          }
          actionLabel={
            categories.length > 0 && hasIban ? KA.products.create : undefined
          }
          onAction={
            categories.length > 0 && hasIban
              ? () => setDialogOpen(true)
              : undefined
          }
        />
      ) : (
        <>
          <ProductsTable
            products={paginated}
            onEdit={(p) => {
              setEditing(p);
              setInitialProductKind(
                p.foodType === "combo" || isComboMenuCategory(p.categoryName)
                  ? "combo"
                  : "item",
              );
              setDialogOpen(true);
            }}
            onDuplicate={handleDuplicate}
            onDelete={setDeleteTarget}
          />
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ProductDialog
        key={editing?.id ?? `new-${initialProductKind}`}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        initialProductKind={initialProductKind}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={KA.products.deleteTitle}
        description={
          deleteTarget
            ? KA.products.deleteDesc.replace("{name}", deleteTarget.name)
            : ""
        }
        confirmLabel={KA.delete}
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
