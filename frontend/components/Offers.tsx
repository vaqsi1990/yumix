import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import OfferCard from "@/components/OfferCard";
import RestaurantCard from "@/components/RestaurantCard";
import { getPublicOffers, type OfferRestaurant } from "@/lib/offers";

function restaurantsFromOffers(
  offers: Awaited<ReturnType<typeof getPublicOffers>>["offers"],
): OfferRestaurant[] {
  const map = new Map<
    string,
    {
      slug: string;
      name: string;
      logo: string;
      offersCount: number;
      maxDiscountPercent: number;
    }
  >();

  for (const offer of offers) {
    const percent = Math.round(
      ((offer.price - offer.discountPrice) / offer.price) * 100,
    );
    const key = offer.restaurant.slug;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        slug: offer.restaurant.slug,
        name: offer.restaurant.name,
        logo: offer.restaurant.logo,
        offersCount: 1,
        maxDiscountPercent: percent,
      });
    } else {
      existing.offersCount += 1;
      existing.maxDiscountPercent = Math.max(
        existing.maxDiscountPercent,
        percent,
      );
    }
  }

  return [...map.values()].map((row, index) => ({
    id: `offer-rest-${row.slug}-${index}`,
    slug: row.slug,
    name: row.name,
    categories: "აქციები",
    rating: 0,
    reviews: 0,
    time: "25-45 წთ",
    deliveryFeeLabel: "—",
    image: row.logo,
    logo: row.logo,
    city: "",
    isOpen: true,
    offersCount: row.offersCount,
    maxDiscountPercent: row.maxDiscountPercent,
  }));
}

export default async function Offers() {
  let restaurants: OfferRestaurant[] = [];
  let offers: Awaited<ReturnType<typeof getPublicOffers>>["offers"] = [];

  try {
    const data = await getPublicOffers();
    offers = data.offers ?? [];
    restaurants =
      data.restaurants?.length > 0
        ? data.restaurants
        : restaurantsFromOffers(offers);
  } catch {
    restaurants = [];
    offers = [];
  }

  const hasRestaurants = restaurants.length > 0;
  const hasOffers = offers.length > 0;

  if (!hasRestaurants && !hasOffers) {
    return (
      <section className="w-full bg-white pt-5">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
          <div className="mb-5 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
            <h2 className="min-w-0 font-[family-name:var(--font-inter)] text-[16px] font-bold not-italic leading-tight text-neutral-900 sm:text-[18px] md:text-[20px]">
              აქციები
            </h2>
            <Link
              href="/offers"
              className="inline-flex shrink-0 items-center gap-1 font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-normal text-[#FF0050] transition hover:opacity-80 sm:gap-1.5 md:text-[18px]"
            >
              <span className="sm:hidden">ყველა</span>
              <span className="hidden sm:inline">ყველა აქცია</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="rounded-2xl bg-[#F5F5F5] px-5 py-8 text-center">
            <p className="font-[family-name:var(--font-inter)] text-[16px] font-medium text-neutral-700 md:text-[18px]">
              ამჟამად აქცია არ არის
            </p>
            <p className="mt-1 text-[14px] text-neutral-500 md:text-[16px]">
              რესტორნის მენიუში პროდუქტზე ფასდაკლება დაამატე — აქ გამოჩნდება
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full bg-white pt-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <h2 className="min-w-0 font-[family-name:var(--font-inter)] text-[16px] font-bold not-italic leading-tight text-neutral-900 sm:text-[18px] md:text-[20px]">
            აქციები
          </h2>
          <Link
            href="/offers"
            className="inline-flex shrink-0 items-center gap-1 font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-normal text-[#FF0050] transition hover:opacity-80 sm:gap-1.5 md:text-[18px]"
          >
            <span className="sm:hidden">ყველა</span>
            <span className="hidden sm:inline">ყველა აქცია</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {hasRestaurants ? (
          <HorizontalScroll className="flex gap-4 pb-2">
            {restaurants.map((restaurant) => (
              <li
                key={restaurant.id}
                className="w-[280px] shrink-0 sm:w-[300px]"
              >
                <RestaurantCard
                  restaurant={restaurant}
                  discountBadge={
                    restaurant.maxDiscountPercent > 0
                      ? `−${restaurant.maxDiscountPercent}%`
                      : undefined
                  }
                  offersHint={
                    restaurant.offersCount > 0
                      ? `${restaurant.offersCount} აქცია`
                      : undefined
                  }
                />
              </li>
            ))}
          </HorizontalScroll>
        ) : (
          <HorizontalScroll className="flex gap-4 pb-2">
            {offers.slice(0, 8).map((offer) => (
              <li key={offer.id} className="w-[240px] shrink-0 sm:w-[260px]">
                <OfferCard offer={offer} />
              </li>
            ))}
          </HorizontalScroll>
        )}
      </div>
    </section>
  );
}
