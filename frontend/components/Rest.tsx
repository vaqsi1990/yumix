import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import RestaurantCard from "@/components/RestaurantCard";
import { getPublicRestaurants } from "@/lib/restaurants";

export default async function Rest() {
  let restaurants: Awaited<
    ReturnType<typeof getPublicRestaurants>
  >["restaurants"] = [];

  try {
    const data = await getPublicRestaurants();
    restaurants = data.restaurants;
  } catch {
    restaurants = [];
  }

  const popular = restaurants.slice(0, 8);

  return (
    <section className="w-full bg-white pt-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <h2 className="min-w-0 font-[family-name:var(--font-inter)] text-[16px] font-bold not-italic leading-tight text-neutral-900 sm:text-[18px] md:text-[20px]">
            პოპულარული რესტორნები
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

        <HorizontalScroll className="flex gap-4 pb-2">
          {popular.map((restaurant) => (
            <li
              key={restaurant.id}
              className="w-[280px] shrink-0 sm:w-[300px]"
            >
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
}
