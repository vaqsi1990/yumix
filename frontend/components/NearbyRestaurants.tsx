import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import RestaurantCard from "@/components/RestaurantCard";
import { getNearbyRestaurants } from "@/lib/nearby";

export default async function NearbyRestaurants() {
  const data = await getNearbyRestaurants();
  if (!data) return null;

  return (
    <section className="w-full bg-white pt-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <h2 className="min-w-0 font-[family-name:var(--font-inter)] text-[16px] font-bold not-italic leading-tight text-neutral-900 sm:text-[18px] md:text-[20px]">
            ახლოს მყოფი რესტორნები
          </h2>
          <Link
            href="/restaurants"
            className="inline-flex shrink-0 items-center gap-1 font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-normal text-[#FF0050] transition hover:opacity-80 sm:gap-1.5 md:text-[18px]"
          >
            <span className="sm:hidden">ყველა</span>
            <span className="hidden sm:inline">ყველა რესტორანი</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {data.restaurants.length > 0 ? (
          <HorizontalScroll className="flex gap-4 pb-2">
            {data.restaurants.map((restaurant) => (
              <li
                key={restaurant.id}
                className="w-[280px] shrink-0 sm:w-[300px]"
              >
                <RestaurantCard restaurant={restaurant} />
              </li>
            ))}
          </HorizontalScroll>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center sm:px-6">
            <p className="font-[family-name:var(--font-inter)] text-[16px] font-semibold text-neutral-900 md:text-[18px]">
              {data.hasLocation
                ? "შენს მახლობლად რესტორანი ჯერ არ არის"
                : "მისამართი რუკაზე ჯერ არ არის"}
            </p>
            <p className="mx-auto mt-2 max-w-md text-[16px] text-neutral-500">
              {data.hasLocation
                ? "როცა რესტორანი შენს მიწოდების ზონაში გამოჩნდება, აქ დაინახავ."
                : "დაამატე მისამართი რუკაზე, რომ ახლოს მყოფი რესტორნები გამოჩნდეს."}
            </p>
            {!data.hasLocation ? (
              <Link
                href="/account/addresses"
                className="mt-4 inline-flex text-[16px] font-medium text-[#FF0050] hover:opacity-80"
              >
                მისამართის დამატება
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
