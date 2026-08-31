"use client";

import CategoryCard from "@/components/CategoryCard";
import HorizontalScroll from "@/components/HorizontalScroll";
import type { PublicCategory } from "@/lib/categories";

type CategoriesListProps = {
  categories: PublicCategory[];
};

export default function CategoriesList({ categories }: CategoriesListProps) {
  return (
    <>
      <HorizontalScroll className="-mx-4 flex touch-pan-x gap-3 px-4 md:hidden">
        {categories.map((category) => (
          <li key={category.slug} className="w-[132px] shrink-0">
            <CategoryCard
              href={category.href}
              label={category.label}
              image={category.image}
              compact
            />
          </li>
        ))}
      </HorizontalScroll>

      <ul className="hidden gap-3 md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-5">
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
    </>
  );
}
