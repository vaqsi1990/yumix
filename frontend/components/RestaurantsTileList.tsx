import CategoryCard from "@/components/CategoryCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import type { PublicRestaurant } from "@/lib/restaurants";

type RestaurantsTileListProps = {
  restaurants: PublicRestaurant[];
  /** Home section: horizontal scroll on mobile, grid on desktop */
  featured?: boolean;
};

export default function RestaurantsTileList({
  restaurants,
  featured = false,
}: RestaurantsTileListProps) {
  if (featured) {
    return (
      <>
        <HorizontalScroll className="-mx-4 flex touch-pan-x gap-3 px-4 md:hidden">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id} className="w-[112px] shrink-0">
              <CategoryCard
                href={`/restaurants/${restaurant.slug}`}
                label={restaurant.name}
                image={restaurant.logo}
                compact
                labelSingleLine
              />
            </li>
          ))}
        </HorizontalScroll>

        <ul className="hidden gap-3 md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-4 xl:grid-cols-8">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <CategoryCard
                href={`/restaurants/${restaurant.slug}`}
                label={restaurant.name}
                image={restaurant.logo}
                compact
                labelSingleLine
              />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 md:gap-4 lg:grid-cols-6 xl:grid-cols-8">
      {restaurants.map((restaurant) => (
        <li key={restaurant.id}>
          <CategoryCard
            href={`/restaurants/${restaurant.slug}`}
            label={restaurant.name}
            image={restaurant.logo}
            compact
            labelSingleLine
          />
        </li>
      ))}
    </ul>
  );
}
