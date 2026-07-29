import Image from "next/image";
import Link from "next/link";
import type { PublicRestaurant } from "@/lib/restaurants";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

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
}: {
  restaurant: PublicRestaurant;
}) {
  const href = `/restaurants/${restaurant.slug}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.15)]">
      <div className="relative h-[160px] w-full">
        <Image
          src={restaurant.image}
          alt={restaurant.name}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover"
        />
        <button
          type="button"
          aria-label="რჩეულებში დამატება"
          className="absolute right-3 top-3 rounded-full p-1.5 text-white drop-shadow transition hover:scale-105"
        >
          <HeartIcon className="size-6" />
        </button>
        {!restaurant.isOpen && (
          <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
            დახურულია
          </span>
        )}
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

      <div className="px-4 pb-4 pt-8">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-inter)] text-[18px] font-bold leading-tight text-neutral-900 md:text-[20px]">
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

        <p className="mt-1 text-sm text-neutral-400">{restaurant.categories}</p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-sm text-neutral-500">
            <span>{restaurant.time}</span>
            <span className="mx-1.5 text-neutral-300">·</span>
            <span>{restaurant.deliveryFeeLabel}</span>
          </div>
          <Link
            href={href}
            className="rounded-lg bg-[#FF0050] px-4 py-2 font-[family-name:var(--font-inter)] text-[16px] font-medium text-white transition hover:bg-[#e60048] md:text-[18px]"
          >
            მენიუ
          </Link>
        </div>
      </div>
    </article>
  );
}
