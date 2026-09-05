"use client";

import Image from "next/image";
import { useMemo, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { formatGel } from "@/lib/admin/format";
import { addToCart } from "@/lib/shop-api";
import { useCart } from "@/components/cart-context";
import { useRequireLogin } from "@/lib/use-require-login";
import { sortVariantsBySize } from "@/lib/product-sizes";
import { productHasSelectableOptions, productNeedsDetailSheet } from "@/lib/product-customization";
import type { PublicMenuProduct } from "@/lib/restaurants";

export default function MenuProductCard({
  product,
  restaurantId,
  restaurantOpen,
  hasRestaurantAddOns = false,
  onOpenDetails,
}: {
  product: PublicMenuProduct;
  restaurantId: string;
  restaurantOpen: boolean;
  hasRestaurantAddOns?: boolean;
  onOpenDetails?: (
    product: PublicMenuProduct,
    variantId?: string,
    quantity?: number,
  ) => void;
}) {
  const router = useRouter();
  const { authReady, requireLogin } = useRequireLogin();
  const cart = useCart();
  const { applyCartResponse } = cart;
  const variants = useMemo(
    () => sortVariantsBySize(product.variants),
    [product.variants],
  );
  const [variantId, setVariantId] = useState<string | null>(
    variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const basePrice =
    product.discountPrice != null && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  const unitPrice = selectedVariant?.price ?? basePrice;
  const lineTotal = unitPrice * quantity;
  const hasDiscount =
    !selectedVariant &&
    product.discountPrice != null &&
    product.discountPrice > 0;
  const unavailable = product.outOfStock;

  async function handleAdd(e: MouseEvent) {
    e.stopPropagation();
    setError("");

    if (unavailable) return;
    const allowed = requireLogin();
    if (allowed !== true) return;
    if (!restaurantOpen) {
      setError("რესტორანი დახურულია");
      return;
    }
    if (variants.length > 0 && !variantId) {
      setError("აირჩიე ზომა");
      return;
    }
    if (productNeedsDetailSheet(product, hasRestaurantAddOns)) {
      onOpenDetails?.(product, variantId ?? undefined, quantity);
      return;
    }

    setBusy(true);
    try {
      const result = await addToCart({
        productId: product.id,
        restaurantId,
        variantId,
        quantity,
      });
      applyCartResponse(result);
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
            {(productHasSelectableOptions(product) || hasRestaurantAddOns) && (
              <p className="mt-1 text-[13px] font-medium text-[#FF0050] md:text-[14px]">
                არჩევანი შეკვეთისას
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
              {formatGel(lineTotal)}
            </p>
            {quantity > 1 && (
              <p className="text-[14px] text-neutral-500 md:text-[16px]">
                {formatGel(unitPrice)} × {quantity}
              </p>
            )}
            {hasDiscount && (
              <p className="text-[16px] text-neutral-400 line-through md:text-[18px]">
                {formatGel(product.price * quantity)}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-3 pt-3">
          {error ? (
            <p className="min-w-0 flex-1 text-right text-[14px] text-[#FF0050]">
              {error}
            </p>
          ) : null}
          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-white">
            <button
              type="button"
              className="px-2.5 py-2 text-neutral-600 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={unavailable || busy || quantity <= 1}
              onClick={(e) => {
                e.stopPropagation();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              aria-label="რაოდენობის შემცირება"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-8 text-center font-[family-name:var(--font-inter)] text-[16px] font-medium tabular-nums text-neutral-900 md:text-[18px]">
              {quantity}
            </span>
            <button
              type="button"
              className="px-2.5 py-2 text-neutral-600 transition hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={unavailable || busy || quantity >= 99}
              onClick={(e) => {
                e.stopPropagation();
                setQuantity((q) => Math.min(99, q + 1));
              }}
              aria-label="რაოდენობის გაზრდა"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            disabled={unavailable || busy || !authReady}
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
