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

function BikeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <path d="M8 17.5h5l2.5-7H14l-2-4H8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 10.5l2 7" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden="true"
    >
      <path
        d="M20 12l-8 8-9-9V4h7l10 8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function RestaurantCard({
  restaurant,
  discountBadge,
  offersHint,
  variant = "default",
}: {
  restaurant: PublicRestaurant;
  discountBadge?: string;
  offersHint?: string;
  variant?: "default" | "compact";
}) {
  const href = `/restaurants/${restaurant.slug}`;

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="flex w-full gap-3 py-1 transition hover:opacity-90"
        aria-label={`${restaurant.name} — მენიუ`}
      >
        <span className="relative size-[72px] shrink-0 overflow-hidden rounded-xl bg-[#F5F5F5] sm:size-20">
          <Image
            src={restaurant.logo}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-[family-name:var(--font-inter)] text-[16px] font-bold leading-tight text-neutral-900 sm:text-[17px]">
              {restaurant.name}
            </span>
            {!restaurant.isOpen && (
              <span className="shrink-0 rounded-md bg-neutral-200 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">
                დახურულია
              </span>
            )}
            {restaurant.deliverable === false && (
              <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[11px] font-medium text-red-700">
                მიუწვდომელი
              </span>
            )}
          </span>

          <span className="mt-1.5 flex flex-col gap-0.5 font-[family-name:var(--font-inter)] text-[13px] text-neutral-500 sm:text-[14px]">
            <span className="inline-flex items-center gap-1">
              <BikeIcon className="size-3.5 shrink-0 text-[#FF0050]" />
              {restaurant.deliveryFeeLabel}
            </span>
            <span>{restaurant.time}</span>
          </span>

          {offersHint || discountBadge ? (
            <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 font-[family-name:var(--font-inter)] text-[13px] font-medium text-sky-600 sm:text-[14px]">
              {offersHint ? (
                <span className="inline-flex shrink-0 items-center gap-1">
                  <TagIcon className="size-3.5 shrink-0" />
                  {offersHint}
                </span>
              ) : null}
              {offersHint && discountBadge ? (
                <span className="text-sky-300" aria-hidden="true">
                  ·
                </span>
              ) : null}
              {discountBadge ? (
                <span className="inline-flex shrink-0 items-center gap-1">
                  <TagIcon className="size-3.5 shrink-0" />
                  {discountBadge}
                </span>
              ) : null}
            </span>
          ) : null}
        </span>
      </Link>
    );
  }

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
          {restaurant.deliverable === false && (
            <span className="rounded-md bg-red-600/90 px-2 py-1 text-xs font-medium text-white">
              მიუწვდომელი
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
