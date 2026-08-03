"use client";

import { useState } from "react";
import { ChevronDown, Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPROVAL_LABELS,
  CITIES,
  RESTAURANT_CATEGORIES,
  SORT_OPTIONS,
} from "./types";
import type { RestaurantFilters } from "./types";
import { cn } from "@/lib/utils";

type RestaurantsToolbarProps = {
  filters: RestaurantFilters;
  totalCount: number;
  selectedCount: number;
  onFiltersChange: (patch: Partial<RestaurantFilters>) => void;
  onAdd: () => void;
  onExport: () => void;
  onBulkApprove: () => void;
  onBulkReject: () => void;
  onBulkSuspend: () => void;
  onBulkDelete: () => void;
};

export default function RestaurantsToolbar({
  filters,
  totalCount,
  selectedCount,
  onFiltersChange,
  onAdd,
  onExport,
  onBulkApprove,
  onBulkReject,
  onBulkSuspend,
  onBulkDelete,
}: RestaurantsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasAdvancedFilters =
    Boolean(filters.city) ||
    Boolean(filters.category) ||
    Boolean(filters.approvalStatus) ||
    Boolean(filters.openStatus);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">რესტორნები</h2>
          <p className="text-[16px] md:text-[18px] text-muted-foreground">
            ნაჩვენები: {totalCount}
            {selectedCount > 0 && ` · არჩეული: ${selectedCount}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onAdd}>
            <Plus className="size-4" />
            რესტორნის დამატება
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="size-4" />
            ექსპორტი
          </Button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-[16px] md:text-[18px] font-medium text-neutral-800">
            {selectedCount} არჩეული
          </span>
          <Button size="sm" variant="secondary" onClick={onBulkApprove}>
            დამტკიცება
          </Button>
          <Button size="sm" variant="secondary" onClick={onBulkReject}>
            უარყოფა
          </Button>
          <Button size="sm" variant="secondary" onClick={onBulkSuspend}>
            შეჩერება
          </Button>
          <Button size="sm" variant="destructive" onClick={onBulkDelete}>
            წაშლა
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="რესტორნის სახელი..."
              value={filters.searchName}
              onChange={(e) =>
                onFiltersChange({ searchName: e.target.value, page: 1 })
              }
              className="pl-9"
            />
          </div>
          <Input
            placeholder="მფლობელის სახელი..."
            value={filters.searchOwner}
            onChange={(e) =>
              onFiltersChange({ searchOwner: e.target.value, page: 1 })
            }
          />
          <Input
            placeholder="ტელეფონი..."
            value={filters.searchPhone}
            onChange={(e) =>
              onFiltersChange({ searchPhone: e.target.value, page: 1 })
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn(
            "shrink-0 self-end sm:self-auto",
            hasAdvancedFilters && "border-primary/40 bg-primary/5",
          )}
          aria-expanded={filtersOpen}
          aria-label={filtersOpen ? "ფილტრების დამალვა" : "ფილტრების ჩვენება"}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-200",
              filtersOpen && "rotate-180",
            )}
          />
        </Button>
      </div>

      {filtersOpen && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select
            value={filters.city || "all"}
            onValueChange={(v) =>
              onFiltersChange({ city: v === "all" ? "" : v, page: 1 })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ქალაქი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა ქალაქი</SelectItem>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.category || "all"}
            onValueChange={(v) =>
              onFiltersChange({ category: v === "all" ? "" : v, page: 1 })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="კატეგორია" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა კატეგორია</SelectItem>
              {RESTAURANT_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.approvalStatus || "all"}
            onValueChange={(v) =>
              onFiltersChange({
                approvalStatus: v === "all" ? "" : v,
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
                Object.entries(APPROVAL_LABELS) as [
                  keyof typeof APPROVAL_LABELS,
                  string,
                ][]
              ).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.openStatus || "all"}
            onValueChange={(v) =>
              onFiltersChange({ openStatus: v === "all" ? "" : v, page: 1 })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="ღია/დაკეტილი" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ყველა</SelectItem>
              <SelectItem value="open">ღია</SelectItem>
              <SelectItem value="closed">დაკეტილი / შეჩერებული</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(v) =>
              onFiltersChange({
                sort: v as RestaurantFilters["sort"],
                page: 1,
              })
            }
          >
            <SelectTrigger>
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
      )}
    </div>
  );
}
