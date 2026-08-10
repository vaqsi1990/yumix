"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatGel } from "@/lib/admin/format";
import {
  ADDON_CATEGORY_SHORT,
  groupAddonsByCategory,
  type AddonCategory,
} from "@/lib/addon-categories";
import { addExtraToCart } from "@/lib/shop-api";
import { syncCartFromResponse, useCart } from "@/components/cart-context";

type CartExtra = {
  id: string;
  name: string;
  price: number;
  category?: AddonCategory;
};

type CartQuickExtrasProps = {
  addOns: CartExtra[];
};

function ExtraChip({
  addon,
  busy,
  onAdd,
}: {
  addon: CartExtra;
  busy: boolean;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      disabled={busy}
      onClick={onAdd}
      className="flex min-w-[140px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white px-3 py-3 text-left transition hover:border-[#FF0050]/40 hover:shadow-sm disabled:opacity-50"
    >
      <span className="line-clamp-2 text-sm font-medium text-neutral-900">
        {addon.name}
      </span>
      <span className="mt-1 text-xs text-neutral-500">+{formatGel(addon.price)}</span>
      <span className="mt-2 text-xs font-semibold text-[#FF0050]">+ დამატება</span>
    </button>
  );
}

export default function CartQuickExtras({ addOns }: CartQuickExtrasProps) {
  const router = useRouter();
  const { setItemCount } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { food, drink } = groupAddonsByCategory(addOns);
  if (food.length === 0 && drink.length === 0) return null;

  async function handleAdd(addonId: string) {
    setBusyId(addonId);
    setError("");
    try {
      const result = await addExtraToCart(addonId, 1);
      setItemCount(syncCartFromResponse(result));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "დამატება ვერ მოხერხდა");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6 space-y-4">
      <div>
        <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
          დაამატე კალათაში
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          სასმელები და დამატებითი კერძები
        </p>
      </div>

      {drink.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700">
            {ADDON_CATEGORY_SHORT.DRINK}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {drink.map((addon) => (
              <ExtraChip
                key={addon.id}
                addon={addon}
                busy={busyId === addon.id}
                onAdd={() => void handleAdd(addon.id)}
              />
            ))}
          </div>
        </div>
      )}

      {food.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold text-neutral-700">
            {ADDON_CATEGORY_SHORT.FOOD}
          </p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {food.map((addon) => (
              <ExtraChip
                key={addon.id}
                addon={addon}
                busy={busyId === addon.id}
                onAdd={() => void handleAdd(addon.id)}
              />
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[#FF0050]">{error}</p>}
    </section>
  );
}
