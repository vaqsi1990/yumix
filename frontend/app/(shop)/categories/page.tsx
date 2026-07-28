import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import SearchBox from "@/components/SearchBox";
import { getPublicCategories } from "@/lib/categories";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CategoriesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const categories = getPublicCategories(q);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
            კატეგორიები
          </h1>
          <p className="mt-1 text-[16px] text-neutral-500 md:text-[18px]">
            {categories.length} კატეგორია
          </p>
        </div>

        <SearchBox
          basePath="/categories"
          initialQuery={q ?? ""}
          placeholder="ძებნა კატეგორიაში"
        />
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
            კატეგორია ვერ მოიძებნა
          </h2>
          <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
            სცადე სხვა საძიებო სიტყვა
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
          >
            ყველას ნახვა
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((category) => (
            <li key={category.slug}>
              <CategoryCard
                href={category.href}
                label={category.label}
                image={category.image}
                description={category.description}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
