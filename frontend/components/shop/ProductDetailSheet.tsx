"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import FavoriteProductButton from "@/components/shop/FavoriteProductButton";
import AddonPicker, {
  addonSelectionTotal,
  type SelectableAddon,
} from "@/components/shop/AddonPicker";
import CustomizationGroupPicker, {
  customizationSelectionTotal,
  validateCustomizationSelection,
} from "@/components/shop/CustomizationGroupPicker";
import { formatGel } from "@/lib/admin/format";
import {
  addToCart,
  cartTargetsDifferentRestaurant,
  confirmCartRestaurantSwitch,
} from "@/lib/shop-api";
import { useCart } from "@/components/cart-context";
import { sortVariantsBySize } from "@/lib/product-sizes";
import type { PublicMenuProduct } from "@/lib/restaurants";
import { useRequireLogin } from "@/lib/use-require-login";
import { cn } from "@/lib/utils";

type ProductDetailSheetProps = {
  product: PublicMenuProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  restaurantName: string;
  restaurantOpen: boolean;
  addOns?: SelectableAddon[];
  initialVariantId?: string | null;
  initialQuantity?: number;
};

function useIsMobileSheet() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return isMobile;
}

export default function ProductDetailSheet({
  product,
  open,
  onOpenChange,
  restaurantId,
  restaurantName,
  restaurantOpen,
  addOns = [],
  initialVariantId = null,
  initialQuantity = 1,
}: ProductDetailSheetProps) {
  const router = useRouter();
  const isMobile = useIsMobileSheet();
  const { authReady, requireLogin } = useRequireLogin();
  const cart = useCart();
  const { applyCartResponse } = cart;
  const [variantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedCustomizations, setSelectedCustomizations] = useState<
    Record<string, number>
  >({});
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>(
    {},
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const variants = useMemo(
    () => (product ? sortVariantsBySize(product.variants) : []),
    [product],
  );

  useEffect(() => {
    if (!open || !product) return;
    const nextVariants = sortVariantsBySize(product.variants);
    setVariantId(initialVariantId ?? nextVariants[0]?.id ?? null);
    setQuantity(Math.min(99, Math.max(1, initialQuantity)));
    setSelectedCustomizations({});
    setSelectedAddOns({});
    setError("");
  }, [open, product, initialVariantId, initialQuantity]);

  const customizationGroups = product?.customizationGroups ?? [];

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

  const customizationTotal = useMemo(
    () => customizationSelectionTotal(customizationGroups, selectedCustomizations),
    [customizationGroups, selectedCustomizations],
  );

  const addonTotal = useMemo(
    () => addonSelectionTotal(addOns, selectedAddOns),
    [addOns, selectedAddOns],
  );

  const lineTotal = (unitPrice + customizationTotal + addonTotal) * quantity;

  function resetState() {
    setVariantId(null);
    setQuantity(1);
    setSelectedCustomizations({});
    setSelectedAddOns({});
    setError("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetState();
    onOpenChange(next);
  }

  async function handleAddToCart() {
    if (!product) return;
    const allowed = requireLogin();
    if (allowed !== true) return;
    if (!restaurantOpen) {
      setError("რესტორანი დახურულია");
      return;
    }
    if (cartTargetsDifferentRestaurant(cart, restaurantId)) {
      if (!confirmCartRestaurantSwitch(cart, restaurantName)) return;
    }
    if (product.outOfStock) {
      setError("პროდუქტი ამოწურულია");
      return;
    }
    if (variants.length > 0 && !variantId) {
      setError("აირჩიე ზომა");
      return;
    }

    const customizationError = validateCustomizationSelection(
      customizationGroups,
      selectedCustomizations,
    );
    if (customizationError) {
      setError(customizationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const result = await addToCart({
        productId: product.id,
        restaurantId,
        variantId,
        quantity,
        customizations: Object.entries(selectedCustomizations).map(
          ([optionId, qty]) => ({
            optionId,
            quantity: qty,
          }),
        ),
        addOns: Object.entries(selectedAddOns).map(([addonId, qty]) => ({
          addonId,
          quantity: qty,
        })),
      });
      applyCartResponse(result);
      handleOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "კალათაში დამატება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  if (!product) return null;

  const footer = (
    <div
      className={cn(
        "shrink-0 border-t border-neutral-100 bg-white",
        isMobile
          ? "px-5 pb-[max(1rem,var(--safe-area-bottom))] pt-4"
          : "pt-4",
      )}
    >
      <div className="mb-3 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
        <span className="text-sm text-neutral-600">ჯამი</span>
        <span className="text-lg font-bold tabular-nums">{formatGel(lineTotal)}</span>
      </div>
      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
      <Button
        type="button"
        className="h-12 w-full bg-[#FF0050] text-base hover:bg-[#e00048]"
        disabled={busy || product.outOfStock || !restaurantOpen || !authReady}
        onClick={() => void handleAddToCart()}
      >
        {busy ? "იმატება..." : "კალათაში დამატება"}
      </Button>
    </div>
  );

  const body = (
    <>
      <SheetHeader
        className={cn(
          "flex-row items-start justify-between gap-3 space-y-0",
          isMobile && "px-5 pt-1",
        )}
      >
        <SheetTitle className="flex-1 pr-2 text-left text-lg">
          {product.name}
        </SheetTitle>
        <FavoriteProductButton productId={product.id} className="shrink-0" />
      </SheetHeader>

      {product.image && (
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100",
            isMobile ? "mx-5 mt-3" : "mt-4",
          )}
        >
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
        <p
          className={cn(
            "text-sm text-muted-foreground",
            isMobile ? "mx-5 mt-4" : "mt-4",
          )}
        >
          {product.description}
        </p>
      )}

      {variants.length > 0 && (
        <div className={cn("mt-5 space-y-2", isMobile && "mx-5")}>
          <p className="text-sm font-semibold">ზომა *</p>
          <div className="space-y-2">
            {variants.map((variant) => {
              const selected = variantId === variant.id;
              return (
                <label
                  key={variant.id}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition ${
                    selected
                      ? "border-[#FF0050] bg-[#FF0050]/5"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="product-size"
                      checked={selected}
                      onChange={() => setVariantId(variant.id)}
                      className="size-4 accent-[#FF0050]"
                    />
                    <span className="text-sm font-medium">{variant.name}</span>
                  </span>
                  <span className="text-sm text-neutral-600">
                    {formatGel(variant.price)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn(isMobile && "mx-5")}>
        <CustomizationGroupPicker
          groups={customizationGroups}
          selected={selectedCustomizations}
          onChange={setSelectedCustomizations}
        />

        <AddonPicker
          addOns={addOns}
          selected={selectedAddOns}
          onChange={setSelectedAddOns}
        />
      </div>

      <div
        className={cn(
          "mt-5 flex items-center justify-between",
          isMobile && "mx-5",
        )}
      >
        <p className="text-sm font-semibold">რაოდენობა</p>
        <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
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

      {!isMobile && (
        <>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
            <span className="text-sm text-neutral-600">ჯამი</span>
            <span className="text-lg font-bold">{formatGel(lineTotal)}</span>
          </div>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <div className="mt-auto pt-4">
            <Button
              type="button"
              className="w-full bg-[#FF0050] hover:bg-[#e00048]"
              disabled={
                busy || product.outOfStock || !restaurantOpen || !authReady
              }
              onClick={() => void handleAddToCart()}
            >
              {busy ? "იმატება..." : "კალათაში დამატება"}
            </Button>
          </div>
        </>
      )}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={cn(
          "flex w-full flex-col gap-0 p-0",
          isMobile
            ? "max-h-[min(92dvh,100%)] overflow-hidden rounded-t-2xl border-t"
            : "gap-4 overflow-y-auto p-6 sm:max-w-lg",
        )}
      >
        {isMobile && (
          <div className="flex shrink-0 justify-center pt-3">
            <div className="h-1 w-10 rounded-full bg-neutral-200" aria-hidden="true" />
          </div>
        )}

        <div
          className={cn(
            isMobile
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-4"
              : "contents",
          )}
        >
          {body}
        </div>

        {isMobile && footer}
      </SheetContent>
    </Sheet>
  );
}
