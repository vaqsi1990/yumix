"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import HorizontalScroll from "@/components/HorizontalScroll";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import { useRequireLogin } from "@/lib/use-require-login";
import { syncCartFromResponse, useCart } from "@/components/cart-context";
import { formatGel } from "@/lib/admin/format";
import type { FavoriteFoodProduct } from "@/lib/favorite-food";
import { addToCart } from "@/lib/shop-api";
import { sortVariantsBySize } from "@/lib/product-sizes";
import { productHasSelectableOptions } from "@/lib/product-customization";

const MOBILE_VISIBLE_PRODUCTS = 3;

function FavoriteFoodProductCard({ product }: { product: FavoriteFoodProduct }) {
  const router = useRouter();
  const { authReady, requireLogin } = useRequireLogin();
  const { setItemCount } = useCart();
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const unitPrice =
    selectedVariant?.price ??
    (product.discountPrice != null && product.discountPrice > 0
      ? product.discountPrice
      : product.price);
  const lineTotal = unitPrice * quantity;
  const hasDiscount =
    !selectedVariant &&
    product.discountPrice != null &&
    product.discountPrice > 0;
  const unavailable = product.outOfStock;

  async function handleAdd() {
    setError("");

    if (unavailable) return;
    const allowed = requireLogin();
    if (allowed !== true) return;
    if (!product.restaurant.isOpen) {
      setError("რესტორანი დახურულია");
      return;
    }
    if (variants.length > 0 && !variantId) {
      setError("აირჩიე ზომა");
      return;
    }
    if (productHasSelectableOptions(product)) {
      setSheetOpen(true);
      return;
    }

    setBusy(true);
    try {
      const result = await addToCart({
        productId: product.id,
        variantId,
        quantity,
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
    <>
      <article className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] transition hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.12)] md:hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.12)]">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative aspect-[4/3] w-full bg-neutral-100 md:h-[160px] md:aspect-auto"
          aria-label={product.name}
        >
          {product.image ? (
            <Image
              src={product.image}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
            />
          ) : null}
        </button>

        <div className="flex flex-1 flex-col px-2.5 pb-3 pt-2 md:px-4 md:pb-4 md:pt-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="text-left"
          >
            <p className="line-clamp-2 font-[family-name:var(--font-inter)] text-[14px] font-bold leading-snug text-neutral-900 md:text-[18px] md:leading-tight lg:text-[20px]">
              {product.name}
            </p>
          </button>

          <div className="mt-1 md:mt-1.5">
            <p className="font-[family-name:var(--font-inter)] text-[14px] font-bold tabular-nums text-neutral-900 md:text-[18px] lg:text-[20px]">
              {formatGel(lineTotal)}
            </p>
            {hasDiscount ? (
              <p className="text-[12px] text-neutral-400 line-through md:text-[14px] lg:text-[16px]">
                {formatGel(product.price * quantity)}
              </p>
            ) : null}
          </div>

          {variants.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1 md:mt-2 md:gap-1.5">
              {variants.map((variant) => {
                const selected = variantId === variant.id;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => {
                      setVariantId(variant.id);
                      setError("");
                    }}
                    className={`rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition md:px-2.5 md:py-1 md:text-[12px] lg:text-[14px] ${
                      selected
                        ? "border-[#FF0050] bg-[#FF0050] text-white"
                        : "border-neutral-200 bg-white text-neutral-700"
                    }`}
                  >
                    {variant.name}
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="mt-auto flex flex-col gap-1.5 pt-2 md:gap-2 md:pt-4">
            {error ? (
              <p className="text-[11px] leading-snug text-[#FF0050] md:text-[12px] lg:text-[14px]">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-2">
              <div className="inline-flex w-full items-center justify-center rounded-lg border border-neutral-200 bg-white md:w-auto md:shrink-0">
                <button
                  type="button"
                  className="px-2 py-1.5 text-neutral-600 disabled:opacity-40 md:px-3 md:py-2"
                  disabled={unavailable || busy || quantity <= 1}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="რაოდენობის შემცირება"
                >
                  <Minus className="size-3.5 md:size-4" />
                </button>
                <span className="min-w-7 text-center text-[14px] font-medium tabular-nums md:min-w-8 md:text-[16px] lg:text-[18px]">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="px-2 py-1.5 text-neutral-600 disabled:opacity-40 md:px-3 md:py-2"
                  disabled={unavailable || busy || quantity >= 99}
                  onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  aria-label="რაოდენობის გაზრდა"
                >
                  <Plus className="size-3.5 md:size-4" />
                </button>
              </div>
              <button
                type="button"
                disabled={unavailable || busy || !authReady}
                onClick={() => void handleAdd()}
                className="w-full rounded-lg bg-[#FF0050] px-2 py-2 font-[family-name:var(--font-inter)] text-[13px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:bg-neutral-300 md:min-w-0 md:flex-1 md:px-3 md:py-2.5 md:text-[16px] lg:text-[18px]"
              >
                {unavailable
                  ? "ამოწურული"
                  : busy
                    ? "..."
                    : added
                      ? "დაემატა"
                      : "კალათაში"}
              </button>
            </div>
          </div>
        </div>
      </article>

      <ProductDetailSheet
        product={product}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantOpen={product.restaurant.isOpen}
        initialVariantId={variantId}
        initialQuantity={quantity}
      />
    </>
  );
}

export default function FavoriteFoodProductsRow({
  products,
}: {
  products: FavoriteFoodProduct[];
}) {
  const mobileScrollable = products.length > MOBILE_VISIBLE_PRODUCTS;

  return (
    <>
      <div className="relative md:hidden">
        <ul
          className="flex max-h-[min(calc(var(--favorite-food-mobile-row-height)*3+1.5rem),80dvh)] snap-y snap-mandatory flex-col gap-3 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={
            {
              "--favorite-food-mobile-row-height": "24rem",
            } as CSSProperties
          }
          aria-label="სასურველი საკვები"
        >
          {products.map((product) => (
            <li key={product.id} className="shrink-0 snap-start snap-always">
              <FavoriteFoodProductCard product={product} />
            </li>
          ))}
        </ul>

        {mobileScrollable ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
            aria-hidden
          />
        ) : null}
      </div>

      <HorizontalScroll className="hidden gap-4 pb-2 md:flex">
        {products.map((product) => (
          <li key={product.id} className="w-[280px] shrink-0 lg:w-[300px]">
            <FavoriteFoodProductCard product={product} />
          </li>
        ))}
      </HorizontalScroll>
    </>
  );
}
