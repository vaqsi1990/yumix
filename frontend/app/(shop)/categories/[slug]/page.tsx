import Link from "next/link";
import { notFound } from "next/navigation";
import RestaurantCard from "@/components/RestaurantCard";
import { getCategoryBySlug } from "@/lib/categories";
import { getPublicRestaurants } from "@/lib/restaurants";

type Props = {
  params: Promise<{ slug: string }>;
};

const SLUG_KEYWORDS: Record<string, string[]> = {
  pizza: ["პიცა", "იტალიურ"],
  burger: ["ბურგერ", "ამერიკულ"],
  sushi: ["სუში", "აზიურ"],
  georgian: ["ქართულ", "ტრადიციულ"],
  salads: ["სალათ"],
  soups: ["სუპ"],
  desserts: ["დესერტ", "ტკბილ"],
  drinks: ["სასმელ"],
  other: [],
};

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  let restaurants: Awaited<
    ReturnType<typeof getPublicRestaurants>
  >["restaurants"] = [];

  try {
    const data = await getPublicRestaurants();
    restaurants = data.restaurants;
  } catch {
    restaurants = [];
  }

  const keywords = SLUG_KEYWORDS[slug] ?? [category.label];

  const filtered =
    slug === "other"
      ? restaurants
      : restaurants.filter((restaurant) => {
          const haystack =
            `${restaurant.name} ${restaurant.categories}`.toLowerCase();
          return keywords.some((keyword) =>
            haystack.includes(keyword.toLowerCase()),
          );
        });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6 sm:mb-8">
       
        <h1 className="mt-1 font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
          {category.label}
        </h1>
        <p className="mt-1 text-[16px] text-neutral-500 md:text-[18px]">
          {category.description} · {filtered.length} რესტორანი
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
            ამ კატეგორიაში რესტორანი ჯერ არ არის
          </h2>
          <Link
            href="/restaurants"
            className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
          >
            ყველა რესტორანი
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
