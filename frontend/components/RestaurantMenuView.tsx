import Image from "next/image";
import Link from "next/link";
import { formatGel } from "@/lib/admin/format";
import { sortVariantsBySize } from "@/lib/product-sizes";
import type {
  PublicMenuCategory,
  PublicMenuProduct,
  PublicRestaurantDetail,
} from "@/lib/restaurants";

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

function ProductCard({
  product,
  onSelect,
}: {
  product: PublicMenuProduct;
  onSelect?: (product: PublicMenuProduct) => void;
}) {
  const displayPrice =
    product.discountPrice != null && product.discountPrice > 0
      ? product.discountPrice
      : product.price;
  const hasDiscount =
    product.discountPrice != null && product.discountPrice > 0;
  const unavailable = product.outOfStock;

  return (
    <article className="flex w-full gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_0_4px_0_rgba(0,0,0,0.06)] sm:p-5">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:size-32">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-[16px] text-neutral-400">
            —
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900 md:text-[18px]">
              {product.name}
            </h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-[16px] text-neutral-500 md:text-[18px]">
                {product.description}
              </p>
            )}
            {product.variants.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {sortVariantsBySize(product.variants).map((variant) => (
                  <span
                    key={variant.id}
                    className="rounded-md border border-neutral-200 px-2 py-0.5 text-[14px] font-medium text-neutral-700 md:text-[16px]"
                  >
                    {variant.name} · {formatGel(variant.price)}
                  </span>
                ))}
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

        <div className="mt-auto flex items-center justify-end pt-3">
          <button
            type="button"
            disabled={unavailable}
            onClick={() => onSelect?.(product)}
            className="rounded-lg bg-[#FF0050] px-4 py-2 font-[family-name:var(--font-inter)] text-[16px] font-medium text-white transition hover:bg-[#e60048] disabled:cursor-not-allowed disabled:bg-neutral-300 md:text-[18px]"
          >
            {unavailable ? "ამოწურული" : "კალათაში"}
          </button>
        </div>
      </div>
    </article>
  );
}

function MenuCategorySection({
  category,
  onProductClick,
}: {
  category: PublicMenuCategory;
  onProductClick?: (product: PublicMenuProduct) => void;
}) {
  return (
    <section id={`category-${category.id}`} className="scroll-mt-28">
      <h2 className="mb-4 text-center font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
        {category.name}
      </h2>
      <ul className="grid w-full gap-4">
        {category.products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} onSelect={onProductClick} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const pageContainerClass =
  "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8";

export default function RestaurantMenuView({
  restaurant,
  menu,
  onProductClick,
}: {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  onProductClick?: (product: PublicMenuProduct) => void;
}) {
  return (
    <div className="pb-12">
      <div className="relative h-48 w-full bg-neutral-200 sm:h-56 lg:h-64">
        <Image
          src={restaurant.image}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className={`absolute bottom-0 left-0 right-0 ${pageContainerClass} pb-5`}>
          <Link
            href="/restaurants"
            className="mb-3 inline-flex text-[16px] font-medium text-white/90 hover:text-white md:text-[18px]"
          >
            ← რესტორნები
          </Link>
          <div className="flex items-end justify-center gap-4 sm:justify-start">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm sm:size-20">
              <Image
                src={restaurant.logo}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="truncate font-[family-name:var(--font-inter)] text-[22px] font-bold text-white md:text-[28px]">
                {restaurant.name}
              </h1>
              <p className="mt-0.5 text-[16px] text-white/85 md:text-[18px]">
                {restaurant.categories}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${pageContainerClass} pt-6`}>
        <div className="flex w-full flex-wrap items-center justify-center gap-4 border-b border-neutral-100 pb-5 text-center">
          <div className="flex items-center gap-1.5">
            <StarIcon className="size-4 text-[#F5C518]" />
            <span className="font-semibold text-neutral-900">
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "—"}
            </span>
            <span className="text-[16px] text-neutral-400 md:text-[18px]">
              ({restaurant.reviews})
            </span>
          </div>
          <span className="text-neutral-300">·</span>
          <span className="text-[16px] text-neutral-500 md:text-[18px]">
            {restaurant.time}
          </span>
          <span className="text-neutral-300">·</span>
          <span className="text-[16px] text-neutral-500 md:text-[18px]">
            მიწოდება {restaurant.deliveryFeeLabel}
          </span>
          {restaurant.minimumOrderLabel &&
            restaurant.minimumOrderLabel !== "—" && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-[16px] text-neutral-500 md:text-[18px]">
                  მინ. {restaurant.minimumOrderLabel}
                </span>
              </>
            )}
          {!restaurant.isOpen && (
            <span className="rounded-md bg-neutral-900 px-2.5 py-1 text-[16px] font-medium text-white md:text-[18px]">
              დახურულია
            </span>
          )}
        </div>

        {restaurant.description && (
          <p className="mt-4 text-center text-[16px] text-neutral-600 md:text-[18px]">
            {restaurant.description}
          </p>
        )}

        {menu.length > 0 && (
          <nav className="sticky top-0 z-10 mt-5 border-b border-neutral-100 bg-white/95 py-3 backdrop-blur">
            <ul className="flex flex-wrap justify-center gap-2">
              {menu.map((category) => (
                <li key={category.id} className="shrink-0">
                  <a
                    href={`#category-${category.id}`}
                    className="inline-flex rounded-full border border-neutral-200 px-4 py-2 text-[16px] font-medium text-neutral-700 transition hover:border-[#FF0050] hover:text-[#FF0050] md:text-[18px]"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div className="mt-8 space-y-10">
          {menu.length === 0 ? (
            <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
              <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
                მენიუ ჯერ არ არის
              </h2>
              <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
                ამ რესტორნისთვის პროდუქტები ჯერ არ არის დამატებული
              </p>
              <Link
                href="/restaurants"
                className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
              >
                სხვა რესტორნები
              </Link>
            </div>
          ) : (
            menu.map((category) => (
              <MenuCategorySection
                key={category.id}
                category={category}
                onProductClick={onProductClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
