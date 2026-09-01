"use client";

import Image from "next/image";
import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import type { FavoriteFoodProduct } from "@/lib/favorite-food";

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2l2.9 6.9L22 10.2l-5 4.9 1.2 7L12 18.3 5.8 22.1 7 15.1 2 10.2l7.1-1.3L12 2z" />
    </svg>
  );
}

function FavoriteFoodProductCard({ product }: { product: FavoriteFoodProduct }) {
  const { restaurant } = product;
  const href = `/restaurants/${restaurant.slug}`;

  return (
    <Link
      href={href}
      className="flex h-full w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] transition hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[4/3] w-full bg-neutral-100 md:h-[160px] md:aspect-auto">
        {product.image ? (
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-2 px-2.5 pb-3 pt-2 md:px-4 md:pb-4 md:pt-3">
        <p className="line-clamp-2 font-[family-name:var(--font-inter)] text-[14px] font-bold leading-snug text-neutral-900 md:text-[18px] md:leading-tight">
          {product.name}
        </p>

        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 font-[family-name:var(--font-inter)] text-[12px] text-neutral-500 md:text-[14px]">
          <span className="inline-flex items-center gap-1">
            <StarIcon className="size-3.5 shrink-0 text-[#F5C518]" />
            <span className="font-semibold text-neutral-900">
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "—"}
            </span>
            {restaurant.reviews > 0 ? (
              <span className="text-neutral-400">({restaurant.reviews})</span>
            ) : null}
          </span>
          <span className="text-neutral-300">·</span>
          <span>{restaurant.time}</span>
          <span className="text-neutral-300">·</span>
          <span>{restaurant.deliveryFeeLabel}</span>
        </div>
      </div>
    </Link>
  );
}

export default function FavoriteFoodProductsRow({
  products,
}: {
  products: FavoriteFoodProduct[];
}) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden" aria-label="სასურველი საკვები">
        {products.map((product) => (
          <li key={product.id}>
            <FavoriteFoodProductCard product={product} />
          </li>
        ))}
      </ul>

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
