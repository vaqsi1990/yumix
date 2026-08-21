"use client";

import Image from "next/image";
import { useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { formatGel } from "@/lib/admin/format";
import { addToCart } from "@/lib/shop-api";
import { syncCartFromResponse, useCart } from "@/components/cart-context";
import { useAuth } from "@/components/auth-context";
import { sortVariantsBySize } from "@/lib/product-sizes";
import type { PublicMenuProduct } from "@/lib/restaurants";

function needsCustomization(product: PublicMenuProduct) {
  return (product.customizationGroups ?? []).some(
    (group) => group.required || group.minSelections > 0,
  );
}

export default function MenuProductCard({
  product,
  restaurantOpen,
  onOpenDetails,
}: {
  product: PublicMenuProduct;
  restaurantOpen: boolean;
  onOpenDetails?: (product: PublicMenuProduct, variantId?: string) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { setItemCount } = useCart();
  const variants = useMemo(
    () => sortVariantsBySize(product.variants),
    [product.variants],
  );
  const [variantId, setVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const basePrice =
    product.discountPrice != null && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  const displayPrice = selectedVariant?.price ?? basePrice;
  const hasDiscount =
    !selectedVariant &&
    product.discountPrice != null &&
    product.discountPrice > 0;
  const unavailable = product.outOfStock;

  async function handleAdd(e: MouseEvent) {
    e.stopPropagation();
    setError("");

    if (unavailable) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (!restaurantOpen) {
      setError("რესტორანი დახურულია");
      return;
    }
    if (variants.length > 0 && !variantId) {
      setError("აირჩიე ზომა");
      return;
    }
    if (needsCustomization(product)) {
      onOpenDetails?.(product, variantId ?? undefined);
      return;
    }

    setBusy(true);
    try {
      const result = await addToCart({
        productId: product.id,
        variantId,
        quantity: 1,
      });
      setItemCount(syncCartFromResponse(result));
      setAdded(true);
      window.setTimeout(() => setAdded(false), 1600);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "კალათაში დამატება ვერ მოხერხდა",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="flex w-full gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_0_4px_0_rgba(0,0,0,0.06)] sm:p-5">
      <button
        type="button"
        className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:size-32"
        onClick={() => onOpenDetails?.(product, variantId ?? undefined)}
        aria-label={product.name}
      >
        {product.image ? (
          <Image
            src={product.image}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[16px] text-neutral-400">
            —
          </div>
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="text-left"
              onClick={() => onOpenDetails?.(product, variantId ?? undefined)}
            >
              <h3 className="font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900 md:text-[18px]">
                {product.name}
              </h3>
            </button>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-[16px] text-neutral-500 md:text-[18px]">
                {product.description}
              </p>
            )}
            {variants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {variants.map((variant) => {
                  const selected = variantId === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVariantId(variant.id);
                        setError("");
                      }}
                      className={`rounded-md border px-2.5 py-1 text-[14px] font-medium transition md:text-[16px] ${
                        selected
                          ? "border-[#FF0050] bg-[#FF0050] text-white"
                          : "border-neutral-200 bg-white text-neutral-700 hover:border-[#FF0050]/50"
                      }`}
                    >
                      {variant.name} · {formatGel(variant.price)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-[family-name:var(--font-inter)] text-[16px] font-bold tabular-nums text-neutral-900 md:text-[18px]">
              {formatGel(displayPrice)}
            </p>
            {hasDiscount && (
              <p className="text-[16px] text-neutral-400 line-through md:text-[18px]">
                {formatGel(product.price)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 pt-3">
          {error ? (
            <p className="min-w-0 flex-1 text-right text-[14px] text-[#FF0050]">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            disabled={unavailable || busy}
            onClick={(e) => void handleAdd(e)}
            className="rounded-lg bg-[#FF0050] px-4 py-2 font-[family-name:var(--font-inter)] text-[16px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:bg-neutral-300 md:text-[18px]"
          >
            {unavailable
              ? "ამოწურული"
              : busy
                ? "იმატება..."
                : added
                  ? "დაემატა"
                  : "კალათაში"}
          </button>
        </div>
      </div>
    </article>
  );
}
