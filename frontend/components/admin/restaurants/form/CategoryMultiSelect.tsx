"use client";

import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { RESTAURANT_CATEGORIES } from "../types";
import { cn } from "@/lib/utils";

type CategoryMultiSelectProps = {
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
};

export default function CategoryMultiSelect({
  value,
  onChange,
  error,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RESTAURANT_CATEGORIES;
    return RESTAURANT_CATEGORIES.filter((category) =>
      category.toLowerCase().includes(q),
    );
  }, [query]);

  function toggle(category: string) {
    if (value.includes(category)) {
      onChange(value.filter((c) => c !== category));
    } else {
      onChange([...value, category]);
    }
  }

  return (
    <div className="space-y-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-auto min-h-9 w-full justify-between font-normal",
              error && "border-destructive",
            )}
          >
            <span className="truncate text-left">
              {value.length > 0
                ? `${value.length} კატეგორია არჩეული`
                : "აირჩიეთ კატეგორიები"}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] p-2"
        >
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ძებნა..."
              className="h-8 pl-8"
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-64 grid gap-1 overflow-y-auto">
            {filteredCategories.map((category) => {
              const selected = value.includes(category);
              return (
                <label
                  key={category}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-neutral-100"
                >
                  <Checkbox
                    checked={selected}
                    onCheckedChange={() => toggle(category)}
                  />
                  <span className="flex-1">{category}</span>
                  {selected && <Check className="size-4 text-primary" />}
                </label>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-neutral-300/60"
                onClick={() => toggle(cat)}
                aria-label={`${cat} წაშლა`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
