"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import AddonPicker, { addonSelectionTotal } from "@/components/shop/AddonPicker";
import { formatGel } from "@/lib/admin/format";
import { addToCart, type PublicAddOn } from "@/lib/shop-api";
import { sortVariantsBySize } from "@/lib/product-sizes";
import type { PublicMenuProduct } from "@/lib/restaurants";
import { useAuth } from "@/components/auth-context";

type ProductDetailSheetProps = {
  product: PublicMenuProduct | null;
  addOns: PublicAddOn[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantOpen: boolean;
};

export default function ProductDetailSheet({
  product,
  addOns,
  open,
  onOpenChange,
  restaurantOpen,
}: ProductDetailSheetProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const variants = useMemo(
    () => (product ? sortVariantsBySize(product.variants) : []),
    [product],
  );

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    if (variantId) {
      return variants.find((v) => v.id === variantId)?.price ?? product.price;
    }
    if (product.discountPrice != null && product.discountPrice > 0) {
      return product.discountPrice;
    }
    return product.price;
  }, [product, variantId, variants]);

  const addOnTotal = useMemo(
    () => addonSelectionTotal(addOns, selectedAddons),
    [selectedAddons, addOns],
  );

  const lineTotal = (unitPrice + addOnTotal) * quantity;

  function resetState() {
    setVariantId(null);
    setQuantity(1);
    setSelectedAddons({});
    setError("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  async function handleAddToCart() {
    if (!product) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!restaurantOpen) {
      setError("რესტორანი დახურულია");
      return;
    }
    if (product.outOfStock) {
      setError("პროდუქტი ამოწურულია");
      return;
    }
    if (variants.length > 0 && !variantId) {
      setError("აირჩიე ზომა");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await addToCart({
        productId: product.id,
        variantId,
        quantity,
        addOns: Object.entries(selectedAddons).map(([addonId, qty]) => ({
          addonId,
          quantity: qty,
        })),
      });
      handleOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "კალათაში დამატება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
        </SheetHeader>

        {product.image && (
          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="400px"
              className="object-cover"
            />
          </div>
        )}

        {product.description && (
          <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
        )}

        {variants.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-sm font-semibold">ზომა *</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setVariantId(variant.id)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    variantId === variant.id
                      ? "border-[#FF0050] bg-[#FF0050]/10 text-[#FF0050]"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  {variant.name} · {formatGel(variant.price)}
                </button>
              ))}
            </div>
          </div>
        )}

        <AddonPicker
          addOns={addOns}
          selected={selectedAddons}
          onChange={setSelectedAddons}
        />

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold">რაოდენობა</p>
          <div className="inline-flex items-center rounded-lg border border-neutral-200">
            <button
              type="button"
              className="px-3 py-2"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center text-sm font-medium">
              {quantity}
            </span>
            <button
              type="button"
              className="px-3 py-2"
              disabled={quantity >= 99}
              onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
          <span className="text-sm text-neutral-600">ჯამი</span>
          <span className="text-lg font-bold">{formatGel(lineTotal)}</span>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-auto pt-4">
          <Button
            type="button"
            className="w-full bg-[#FF0050] hover:bg-[#e00048]"
            disabled={busy || product.outOfStock || !restaurantOpen}
            onClick={() => void handleAddToCart()}
          >
            {busy ? "იმატება..." : "კალათაში დამატება"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
