"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import ProductsTable from "./ProductsTable";
import ProductsToolbar from "./ProductsToolbar";
import ProductViewDrawer from "./ProductViewDrawer";
import type {
  AdminCategory,
  AdminProduct,
  AdminRestaurant,
  ProductFilters,
} from "./types";
import {
  filterAndSortProducts,
  paginateProducts,
  toggleProductAvailability,
} from "./utils";

const DEFAULT_FILTERS: ProductFilters = {
  search: "",
  restaurantId: "",
  categoryId: "",
  availability: "",
  sort: "newest",
  page: 1,
  pageSize: 10,
};

export default function AdminProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialRestaurantId = searchParams.get("restaurantId") ?? "";
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<ProductFilters>(() => ({
    ...DEFAULT_FILTERS,
    restaurantId: initialRestaurantId,
  }));
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/backend/admin/products");
      if (!res.ok) throw new Error("load failed");
      const data = (await res.json()) as {
        products: AdminProduct[];
        restaurants: AdminRestaurant[];
        categories: AdminCategory[];
      };
      setProducts(data.products);
      setRestaurants(data.restaurants);
      setCategories(data.categories);
    } catch {
      setError("პროდუქტების ჩატვირთვა ვერ მოხერხდა");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setFilters((f) =>
      f.restaurantId === initialRestaurantId
        ? f
        : { ...f, restaurantId: initialRestaurantId, categoryId: "", page: 1 },
    );
  }, [initialRestaurantId]);

  useEffect(() => {
    void loadProducts();
  }, [pathname, loadProducts]);

  const filtered = useMemo(
    () => filterAndSortProducts(products, filters),
    [products, filters],
  );

  const { items: pageItems, totalPages, total } = useMemo(
    () => paginateProducts(filtered, filters.page, filters.pageSize),
    [filtered, filters.page, filters.pageSize],
  );

  const updateFilters = useCallback((patch: Partial<ProductFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  }, []);

  function handleAddProduct() {
    router.push(
      filters.restaurantId
        ? `/admin/products/new?restaurantId=${filters.restaurantId}`
        : "/admin/products/new",
    );
  }

  function handleEdit(product: AdminProduct) {
    router.push(`/admin/products/${product.id}/edit`);
  }

  async function handleDuplicate(product: AdminProduct) {
    const res = await fetch(`/api/backend/admin/products/${product.id}/duplicate`, {
      method: "POST",
    });
    if (!res.ok) {
      window.alert("დუბლირება ვერ მოხერხდა");
      return;
    }
    const data = (await res.json()) as { product: AdminProduct };
    setProducts((prev) => [data.product, ...prev]);
  }

  async function handleDelete(product: AdminProduct) {
    if (!window.confirm(`"${product.name}" წავშალოთ?`)) return;
    const res = await fetch(`/api/backend/admin/products/${product.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      window.alert("წაშლა ვერ მოხერხდა");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  async function handleToggle(product: AdminProduct) {
    const next = toggleProductAvailability(product);
    const res = await fetch(`/api/backend/admin/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: next.availability }),
    });
    if (!res.ok) {
      window.alert("სტატუსის შეცვლა ვერ მოხერხდა");
      return;
    }
    const data = (await res.json()) as { product: AdminProduct };
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? data.product : p)),
    );
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(products, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yumix-products-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <p className="text-[16px] md:text-[18px] text-muted-foreground">იტვირთება...</p>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-[16px] md:text-[18px] text-destructive">{error}</p>
        <button
          type="button"
          className="text-[16px] md:text-[18px] font-medium text-primary hover:underline"
          onClick={() => void loadProducts()}
        >
          თავიდან ცდა
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProductsToolbar
        filters={filters}
        restaurants={restaurants}
        categories={categories}
        totalCount={total}
        onFiltersChange={updateFilters}
        onAddProduct={handleAddProduct}
        onExport={handleExport}
      />

      <Card>
        <CardContent className="p-0">
          <ProductsTable
            products={pageItems}
            restaurants={restaurants}
            categories={categories}
            onView={setViewProduct}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onToggleAvailability={handleToggle}
          />
        </CardContent>
      </Card>

      <Pagination
        page={filters.page}
        totalPages={totalPages}
        onPageChange={(page) => updateFilters({ page })}
      />

      <ProductViewDrawer
        product={viewProduct}
        open={viewProduct != null}
        onOpenChange={(open) => !open && setViewProduct(null)}
        restaurants={restaurants}
        categories={categories}
      />
    </div>
  );
}
