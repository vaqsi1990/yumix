import Link from "next/link";
import { notFound } from "next/navigation";
import RestaurantCard from "@/components/RestaurantCard";
import SubcategoriesList from "@/components/SubcategoriesList";
import {
  getCategoryBySlug,
  getCategoryKeywords,
  getSubcategoryBySlug,
} from "@/lib/categories";
import { getPublicRestaurantsByMenuFood } from "@/lib/restaurants";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
};

export default async function CategoryDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const selectedSub = sub ? getSubcategoryBySlug(slug, sub) : null;
  if (sub && !selectedSub) notFound();

  if (category.subcategories.length > 0 && !selectedSub) {
    return (
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mt-1 font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
            {category.label}
          </h1>
          <p className="mt-1 text-[16px] text-neutral-500 md:text-[18px]">
            აირჩიე კერძის ტიპი
          </p>
        </div>

        <SubcategoriesList subcategories={category.subcategories} />
      </section>
    );
  }

  const keywords = selectedSub
    ? getCategoryKeywords(slug, sub)
    : getCategoryKeywords(slug);

  let filtered: Awaited<
    ReturnType<typeof getPublicRestaurantsByMenuFood>
  >["restaurants"] = [];

  try {
    const data = await getPublicRestaurantsByMenuFood(keywords);
    filtered = data.restaurants;
  } catch {
    filtered = [];
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6 sm:mb-8">
        {selectedSub ? (
          <Link
            href={category.href}
            className="inline-flex items-center gap-1 text-[16px] text-[#FF0050] transition hover:opacity-80 md:text-[18px]"
          >
            <span aria-hidden="true">←</span>
            {category.label}
          </Link>
        ) : null}
        <h1 className="mt-1 font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
          {selectedSub?.label ?? category.label}
        </h1>
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
