"use client";

import {
  Download,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminCategory, AdminRestaurant } from "./types";
import { AVAILABILITY_LABELS, SORT_OPTIONS } from "./types";
import type { ProductFilters } from "./types";
import { getCategoriesForRestaurant } from "./helpers";

type ProductsToolbarProps = {
  filters: ProductFilters;
  restaurants: AdminRestaurant[];
  categories: AdminCategory[];
  totalCount: number;
  onFiltersChange: (patch: Partial<ProductFilters>) => void;
  onAddProduct: () => void;
  onExport: () => void;
};

export default function ProductsToolbar({
  filters,
  restaurants,
  categories,
  totalCount,
  onFiltersChange,
  onAddProduct,
  onExport,
}: ProductsToolbarProps) {
  const scopedCategories = getCategoriesForRestaurant(
    filters.restaurantId,
    categories,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">პროდუქტები</h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">სულ: {totalCount}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAddProduct}>
            <Plus className="size-4" />
            პროდუქტის დამატება
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="size-4" />
            ექსპორტი
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="ძებნა სახელით..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ search: e.target.value, page: 1 })
            }
            className="pl-9"
          />
        </div>

        <Select
          value={filters.restaurantId || "all"}
          onValueChange={(v) =>
            onFiltersChange({
              restaurantId: v === "all" ? "" : v,
              categoryId: "",
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="რესტორანი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა რესტორანი</SelectItem>
            {restaurants.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.categoryId || "all"}
          onValueChange={(v) =>
            onFiltersChange({
              categoryId: v === "all" ? "" : v,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="კატეგორია" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა კატეგორია</SelectItem>
            {scopedCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.availability || "all"}
          onValueChange={(v) =>
            onFiltersChange({
              availability: v === "all" ? "" : v,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="სტატუსი" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ყველა სტატუსი</SelectItem>
            {(
              Object.entries(AVAILABILITY_LABELS) as [
                keyof typeof AVAILABILITY_LABELS,
                string,
              ][]
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filters.restaurantId && scopedCategories.length === 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[16px] md:text-[18px] text-amber-900">
          ამ რესტორნის მენიუს კატეგორიები ჯერ არ არის. დაამატე პროდუქტისას ან
          გახსენი{" "}
          <a
            href={`/admin/products/new?restaurantId=${filters.restaurantId}`}
            className="font-medium underline"
          >
            ახალი პროდუქტი
          </a>{" "}
          და შექმენი კატეგორია იქ.
        </p>
      )}

      <div className="flex justify-end">
        <Select
          value={filters.sort}
          onValueChange={(v) =>
            onFiltersChange({
              sort: v as ProductFilters["sort"],
              page: 1,
            })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="დალაგება" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
