"use client";

import { useState } from "react";
import Image from "next/image";
import HorizontalScroll from "@/components/HorizontalScroll";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import { formatGel } from "@/lib/admin/format";
import { useRestaurantAddOns } from "@/lib/use-restaurant-addons";
import type { RecommendedProduct } from "@/lib/recommendations";

export default function RecommendedProductsRow({
  products,
}: {
  products: RecommendedProduct[];
}) {
  const [selected, setSelected] = useState<RecommendedProduct | null>(null);
  const addOns = useRestaurantAddOns(selected?.restaurant.slug);

  return (
    <>
      <HorizontalScroll className="flex gap-3 pb-2 sm:gap-4">
        {products.map((product) => {
          const displayPrice =
            product.discountPrice != null && product.discountPrice > 0
              ? product.discountPrice
              : product.price;
          const hasDiscount =
            product.discountPrice != null && product.discountPrice > 0;

          return (
            <li key={product.id} className="w-[168px] shrink-0 sm:w-[184px]">
              <button
                type="button"
                onClick={() => setSelected(product)}
                className="block w-full overflow-hidden rounded-xl border border-neutral-200 bg-white text-left transition hover:shadow-[0_0_4px_0_rgba(0,0,0,0.12)]"
              >
                <div className="relative aspect-square w-full bg-neutral-100">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="184px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="px-2.5 py-2.5">
                  <p className="truncate text-[13px] text-[#FF0050]">
                    {product.restaurant.name}
                  </p>
                  <p className="mt-0.5 truncate font-[family-name:var(--font-inter)] text-[16px] font-medium text-neutral-900">
                    {product.name}
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900">
                    {formatGel(displayPrice)}
                    {hasDiscount ? (
                      <span className="ml-1.5 text-[13px] font-normal text-neutral-400 line-through">
                        {formatGel(product.price)}
                      </span>
                    ) : null}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </HorizontalScroll>

      <ProductDetailSheet
        product={selected}
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        restaurantId={selected?.restaurant.id ?? ""}
        restaurantName={selected?.restaurant.name ?? ""}
        restaurantOpen={selected?.restaurant.isOpen ?? true}
        addOns={addOns}
      />
    </>
  );
}
