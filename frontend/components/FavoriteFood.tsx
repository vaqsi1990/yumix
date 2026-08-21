import Image from "next/image";
import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import { getPublicFavoriteFoods } from "@/lib/favorite-food";

export default async function FavoriteFood() {
  const { items } = await getPublicFavoriteFoods();
  if (items.length === 0) return null;

  return (
    <section className="w-full bg-white py-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <h2 className="mb-5 font-[family-name:var(--font-inter)] text-[18px] font-bold not-italic text-neutral-900 sm:mb-6 md:text-[20px]">
          სასურველი საკვები
        </h2>

        <HorizontalScroll className="flex gap-3 pb-2 sm:gap-4">
          {items.map((food) => (
            <li key={food.id} className="w-[150px] shrink-0 sm:w-[168px]">
              <Link
                href={`/categories/${food.slug}`}
                className="block overflow-hidden rounded-xl border border-neutral-200 bg-white transition hover:shadow-[0_0_4px_0_rgba(0,0,0,0.12)]"
              >
                <div className="relative aspect-square w-full">
                  <Image
                    src={food.image}
                    alt={food.label}
                    fill
                    sizes="168px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 px-2.5 py-2.5">
                  <span className="truncate font-[family-name:var(--font-inter)] text-[16px] font-medium text-neutral-900 md:text-[18px]">
                    {food.label}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </HorizontalScroll>
      </div>
    </section>
  );
}
