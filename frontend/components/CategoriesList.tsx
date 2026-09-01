"use client";

import CategoryCard from "@/components/CategoryCard";
import type { PublicCategory } from "@/lib/categories";

type CategoriesListProps = {
  categories: PublicCategory[];
};

export default function CategoriesList({ categories }: CategoriesListProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {categories.map((category) => (
        <li key={category.slug}>
          <CategoryCard
            href={category.href}
            label={category.label}
            image={category.image}
            description={category.description}
            list
          />
        </li>
      ))}
    </ul>
  );
}
