"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PRODUCT_SIZES,
  sizePricesFromVariants,
  variantsFromSizePrices,
  type ProductSize,
  type ProductSizeVariant,
} from "@/lib/product-sizes";
import { cn } from "@/lib/utils";

type ProductSizeVariantsEditorProps = {
  value: ProductSizeVariant[];
  onChange: (variants: ProductSizeVariant[]) => void;
  emptyHint?: string;
  className?: string;
  numberInputClass?: string;
};

export default function ProductSizeVariantsEditor({
  value,
  onChange,
  emptyHint,
  className,
  numberInputClass,
}: ProductSizeVariantsEditorProps) {
  const prices = sizePricesFromVariants(value);
  const hasAny = PRODUCT_SIZES.some((size) => (prices[size] ?? 0) > 0);

  function updateSizePrice(size: ProductSize, raw: string) {
    const nextPrices = { ...prices };
    const parsed = raw.trim() ? Number(raw.replace(",", ".")) : 0;

    if (parsed > 0) {
      nextPrices[size] = parsed;
    } else {
      delete nextPrices[size];
    }

    onChange(variantsFromSizePrices(nextPrices, value));
  }

  return (
    <div className={cn("space-y-3", className)}>
      {!hasAny && emptyHint ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : null}
      <div className="space-y-2">
        {PRODUCT_SIZES.map((size) => (
          <div
            key={size}
            className="grid items-center gap-2 sm:grid-cols-[72px_1fr]"
          >
            <Label className="text-sm font-semibold">{size}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              placeholder="₾"
              value={prices[size] ?? ""}
              onChange={(e) => updateSizePrice(size, e.target.value)}
              className={numberInputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
