import Image from "next/image";
import Link from "next/link";
import FavoriteRestaurantButton from "@/components/shop/FavoriteRestaurantButton";
import MenuProductCard from "@/components/shop/MenuProductCard";
import type {
  PublicMenuCategory,
  PublicMenuProduct,
  PublicRestaurantDetail,
} from "@/lib/restaurants";
import { onlyCustomerMenuCategories } from "@/lib/menu-category-order";

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

function MenuCategorySection({
  category,
  restaurantId,
  restaurantOpen,
  hasRestaurantAddOns,
  onProductClick,
}: {
  category: PublicMenuCategory;
  restaurantId: string;
  restaurantOpen: boolean;
  hasRestaurantAddOns?: boolean;
  onProductClick?: (
    product: PublicMenuProduct,
    variantId?: string,
    quantity?: number,
  ) => void;
}) {
  return (
    <section id={`category-${category.id}`} className="scroll-mt-28">
      <h2 className="mb-4 text-center font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
        {category.name}
      </h2>
      <ul className="grid w-full gap-4">
        {category.products.map((product) => (
          <li key={product.id}>
            <MenuProductCard
              product={product}
              restaurantId={restaurantId}
              restaurantOpen={restaurantOpen}
              hasRestaurantAddOns={hasRestaurantAddOns}
              onOpenDetails={onProductClick}
            />
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
  menu: rawMenu,
  hasRestaurantAddOns = false,
  onProductClick,
  orderingEnabled,
  deliveryUnavailableReason,
}: {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  hasRestaurantAddOns?: boolean;
  onProductClick?: (
    product: PublicMenuProduct,
    variantId?: string,
    quantity?: number,
  ) => void;
  orderingEnabled?: boolean;
  deliveryUnavailableReason?: string;
}) {
  const menu = onlyCustomerMenuCategories(rawMenu);
  const canOrder = orderingEnabled ?? restaurant.isOpen;

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
        <FavoriteRestaurantButton
          restaurantId={restaurant.id}
          className="absolute right-4 top-4 sm:right-6"
        />
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
          {restaurant.deliverable === false && (
            <span className="rounded-md bg-red-600 px-2.5 py-1 text-[16px] font-medium text-white md:text-[18px]">
              მიუწვდომელი
            </span>
          )}
        </div>

        {restaurant.deliverable === false && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-[16px] text-red-800 md:text-[18px]">
            {deliveryUnavailableReason ??
              "ამ რესტორანიდან მიწოდება შენს მისამართზე არ ხდება. სცადე სხვა რესტორანი ან განაახლე მისამართი."}
          </div>
        )}

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
                restaurantId={restaurant.id}
                restaurantOpen={canOrder}
                hasRestaurantAddOns={hasRestaurantAddOns}
                onProductClick={onProductClick}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
