import FavoriteFoodProductsRow from "@/components/FavoriteFoodProductsRow";
import { getPublicFavoriteFoods } from "@/lib/favorite-food";

export default async function FavoriteFood() {
  const { products = [] } = await getPublicFavoriteFoods();
  if (products.length === 0) return null;

  return (
    <section className="w-full bg-white py-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <h2 className="mb-5 font-[family-name:var(--font-inter)] text-[18px] font-bold not-italic text-neutral-900 sm:mb-6 md:text-[20px]">
          სასურველი საკვები
        </h2>

        <FavoriteFoodProductsRow products={products} />
      </div>
    </section>
  );
}
