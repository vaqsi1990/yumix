"use client";

import { Minus, Plus } from "lucide-react";
import { formatGel } from "@/lib/admin/format";
import {
  ADDON_CATEGORY_LABELS,
  ADDON_CATEGORY_SHORT,
  groupAddonsByCategory,
  type AddonCategory,
} from "@/lib/addon-categories";

export type SelectableAddon = {
  id: string;
  name: string;
  price: number;
  category?: AddonCategory;
};

type AddonPickerProps = {
  addOns: SelectableAddon[];
  selected: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  compact?: boolean;
};

function setAddonQty(
  selected: Record<string, number>,
  id: string,
  qty: number,
) {
  const next = { ...selected };
  if (qty <= 0) delete next[id];
  else next[id] = qty;
  return next;
}

function AddonRow({
  addon,
  qty,
  onQtyChange,
  compact,
}: {
  addon: SelectableAddon;
  qty: number;
  onQtyChange: (qty: number) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white ${
        compact ? "px-3 py-2" : "px-3 py-2.5"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`truncate font-medium ${compact ? "text-sm" : "text-sm"}`}>
          {addon.name}
        </p>
        <p className="text-xs text-neutral-500">+{formatGel(addon.price)}</p>
      </div>

      {qty === 0 ? (
        <button
          type="button"
          onClick={() => onQtyChange(1)}
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#FF0050] text-[#FF0050] transition hover:bg-[#FF0050]/10"
          aria-label={`${addon.name} დამატება`}
        >
          <Plus className="size-4" />
        </button>
      ) : (
        <div className="inline-flex shrink-0 items-center rounded-lg border border-neutral-200">
          <button
            type="button"
            onClick={() => onQtyChange(qty - 1)}
            className="px-2 py-1.5"
            aria-label="შემცირება"
          >
            <Minus className="size-4" />
          </button>
          <span className="min-w-6 text-center text-sm font-semibold">{qty}</span>
          <button
            type="button"
            onClick={() => onQtyChange(Math.min(20, qty + 1))}
            disabled={qty >= 20}
            className="px-2 py-1.5 disabled:opacity-40"
            aria-label="გაზრდა"
          >
            <Plus className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function AddonSection({
  title,
  addOns,
  selected,
  onChange,
  compact,
}: {
  title: string;
  addOns: SelectableAddon[];
  selected: Record<string, number>;
  onChange: (next: Record<string, number>) => void;
  compact?: boolean;
}) {
  if (addOns.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className={`font-semibold ${compact ? "text-sm" : "text-sm"}`}>{title}</p>
      <div className="space-y-2">
        {addOns.map((addon) => (
          <AddonRow
            key={addon.id}
            addon={addon}
            qty={selected[addon.id] ?? 0}
            compact={compact}
            onQtyChange={(qty) => onChange(setAddonQty(selected, addon.id, qty))}
          />
        ))}
      </div>
    </div>
  );
}

export default function AddonPicker({
  addOns,
  selected,
  onChange,
  compact = false,
}: AddonPickerProps) {
  const { food, drink } = groupAddonsByCategory(addOns);

  if (addOns.length === 0) return null;

  return (
    <div className={compact ? "space-y-4" : "mt-5 space-y-5"}>
      <AddonSection
        title={ADDON_CATEGORY_SHORT.FOOD}
        addOns={food}
        selected={selected}
        onChange={onChange}
        compact={compact}
      />
      <AddonSection
        title={ADDON_CATEGORY_SHORT.DRINK}
        addOns={drink}
        selected={selected}
        onChange={onChange}
        compact={compact}
      />
      {!compact && food.length + drink.length < addOns.length && (
        <p className="text-xs text-neutral-400">
          {ADDON_CATEGORY_LABELS.FOOD} / {ADDON_CATEGORY_LABELS.DRINK}
        </p>
      )}
    </div>
  );
}

export function addonSelectionTotal(
  addOns: SelectableAddon[],
  selected: Record<string, number>,
) {
  return Object.entries(selected).reduce((sum, [id, qty]) => {
    const addon = addOns.find((a) => a.id === id);
    return sum + (addon?.price ?? 0) * qty;
  }, 0);
}
