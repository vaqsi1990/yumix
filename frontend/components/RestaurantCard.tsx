import Image from "next/image";
import Link from "next/link";
import FavoriteRestaurantButton from "@/components/shop/FavoriteRestaurantButton";
import type { PublicRestaurant } from "@/lib/restaurants";

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

export default function RestaurantCard({
  restaurant,
  discountBadge,
  offersHint,
}: {
  restaurant: PublicRestaurant;
  discountBadge?: string;
  offersHint?: string;
}) {
  const href = `/restaurants/${restaurant.slug}`;

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)] transition hover:shadow-[0_2px_12px_0_rgba(0,0,0,0.12)]">
      <div className="relative h-[160px] w-full">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <FavoriteRestaurantButton
          restaurantId={restaurant.id}
          className="absolute right-3 top-3"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {discountBadge && (
            <span className="rounded-md bg-[#FF0050] px-2 py-1 text-xs font-semibold text-white">
              {discountBadge}
            </span>
          )}
          {!restaurant.isOpen && (
            <span className="rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
              დახურულია
            </span>
          )}
        </div>
        <div className="absolute -bottom-6 left-4 size-14 overflow-hidden rounded-full border-2 border-white bg-white shadow-sm">
          <Image
            src={restaurant.logo}
            alt=""
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
      </div>

      <div className="relative px-4 pb-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-inter)] text-[18px] font-bold leading-tight text-neutral-900 transition group-hover:text-[#FF0050] md:text-[20px]">
            {restaurant.name}
          </h3>
          <div className="flex shrink-0 items-center gap-1 pt-0.5 text-sm">
            <StarIcon className="size-4 text-[#F5C518]" />
            <span className="font-semibold text-neutral-900">
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "—"}
            </span>
            <span className="text-neutral-400">({restaurant.reviews})</span>
          </div>
        </div>

        {/* <p className="mt-1 text-sm text-neutral-400">
          {offersHint ? (
            <>
              <span className="font-medium text-[#FF0050]">{offersHint}</span>
              <span className="mx-1.5 text-neutral-300">·</span>
              <span>{restaurant.categories}</span>
            </>
          ) : (
            restaurant.categories
          )}
        </p> */}

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-sm text-neutral-500">
            {restaurant.distanceLabel ? (
              <>
                <span>{restaurant.distanceLabel}</span>
                <span className="mx-1.5 text-neutral-300">·</span>
              </>
            ) : null}
            <span>{restaurant.time}</span>
            <span className="mx-1.5 text-neutral-300">·</span>
            <span>{restaurant.deliveryFeeLabel}</span>
          </div>
          <span className="inline-flex shrink-0 rounded-lg bg-[#FF0050] px-4 py-2 font-[family-name:var(--font-inter)] text-[16px] font-medium text-white transition group-hover:bg-[#e60048] md:text-[18px]">
            მენიუ
          </span>
        </div>
      </div>

      <Link
        href={href}
        className="absolute inset-0 z-[1]"
        aria-label={`${restaurant.name} — მენიუ`}
      />
    </article>
  );
}
