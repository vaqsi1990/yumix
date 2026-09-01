"use client";

import Link from "next/link";
import type { PublicSubcategory } from "@/lib/categories";

type SubcategoriesListProps = {
  subcategories: PublicSubcategory[];
};

function SubcategoryCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#F5F5F5] px-4 py-3 text-center transition hover:bg-[#EFEFEF] md:min-h-[60px] md:py-4"
    >
      <span className="font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-snug text-neutral-900 md:text-[18px]">
        {label}
      </span>
    </Link>
  );
}

export default function SubcategoriesList({
  subcategories,
}: SubcategoriesListProps) {
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-4 md:gap-4 lg:grid-cols-5">
      {subcategories.map((subcategory) => (
        <li key={subcategory.slug}>
          <SubcategoryCard
            href={subcategory.href}
            label={subcategory.label}
          />
        </li>
      ))}
    </ul>
  );
}
