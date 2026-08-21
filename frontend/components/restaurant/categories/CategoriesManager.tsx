"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/restaurant/PageHeader";
import TableSkeleton from "@/components/restaurant/skeletons/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { restaurantApi } from "@/lib/restaurant/api";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import { onlyStandardMenuCategories } from "@/lib/menu-category-order";
import type { ProductCategory } from "@/lib/restaurant/types";

export default function CategoriesManager() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await restaurantApi.categories();
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
    loadCategories();
  }, [loadCategories]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={KA.categories.title} description={KA.loading} />
        <TableSkeleton rows={5} cols={3} />
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
        title={KA.categories.title}
        description={KA.categories.subtitle}
      />

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{KA.products.name}</TableHead>
              <TableHead>{KA.menu.productsCount}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category._count.products}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
