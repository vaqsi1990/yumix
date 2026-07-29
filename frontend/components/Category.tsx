import Link from "next/link";
import CategoryCard from "@/components/CategoryCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import { HOME_CATEGORIES } from "@/lib/categories";

export default function Category() {
  return (
    <section className="w-full bg-white pt-5">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-2 sm:mb-6 sm:gap-4">
          <h2 className="min-w-0 font-[family-name:var(--font-inter)] text-[16px] font-bold not-italic leading-tight text-neutral-900 sm:text-[18px] md:text-[20px]">
            კატეგორიები
          </h2>
          <Link
            href="/categories"
            className="inline-flex shrink-0 items-center gap-1 font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-normal text-[#FF0050] transition hover:opacity-80 sm:gap-1.5 md:text-[18px]"
          >
            <span className="sm:hidden">ყველა</span>
            <span className="hidden sm:inline">ყველა კატეგორია</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <HorizontalScroll className="-mx-4 flex touch-pan-x gap-3 px-4 md:hidden">
          {HOME_CATEGORIES.map((category) => (
            <li key={category.slug} className="w-[112px] shrink-0">
              <CategoryCard
                href={category.href}
                label={category.label}
                image={category.image}
                compact
              />
            </li>
          ))}
        </HorizontalScroll>

        <ul className="hidden gap-3 md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-4 xl:grid-cols-8">
          {HOME_CATEGORIES.map((category) => (
            <li key={category.slug}>
              <CategoryCard
                href={category.href}
                label={category.label}
                image={category.image}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
