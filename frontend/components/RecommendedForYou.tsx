import HorizontalScroll from "@/components/HorizontalScroll";
import RecommendedProductsRow from "@/components/RecommendedProductsRow";
import RestaurantCard from "@/components/RestaurantCard";
import { getRecommendedForYou } from "@/lib/recommendations";

export default async function RecommendedForYou() {
  const data = await getRecommendedForYou();
  if (!data) return null;

  const hasRestaurants = data.restaurants.length > 0;
  const hasProducts = data.products.length > 0;
  if (!hasRestaurants && !hasProducts) return null;

  return (
    <section className="w-full bg-white py-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <h2 className="mb-1 font-[family-name:var(--font-inter)] text-[18px] font-bold not-italic text-neutral-900 sm:mb-1.5 md:text-[20px]">
          რეკომენდაცია
        </h2>

        {hasRestaurants ? (
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
        ) : null}

        {hasProducts ? (
          <div className={hasRestaurants ? "mt-6" : ""}>
            <h3 className="mb-4 font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900 md:text-[18px]">
              კერძები შენთვის
            </h3>
            <RecommendedProductsRow products={data.products} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
