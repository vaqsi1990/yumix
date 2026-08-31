"use client";

import Link from "next/link";
import HorizontalScroll from "@/components/HorizontalScroll";
import type { PublicSubcategory } from "@/lib/categories";

type SubcategoriesListProps = {
  subcategories: PublicSubcategory[];
};

function SubcategoryCard({
  href,
  label,
  compact = false,
}: {
  href: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        compact
          ? "flex min-h-[52px] items-center justify-center rounded-2xl bg-[#F5F5F5] px-3 py-3 text-center transition hover:bg-[#EFEFEF]"
          : "flex min-h-[56px] items-center justify-center rounded-2xl bg-[#F5F5F5] px-4 py-4 text-center transition hover:bg-[#EFEFEF] sm:min-h-[60px]"
      }
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
    <>
      <HorizontalScroll className="-mx-4 flex touch-pan-x gap-3 px-4 md:hidden">
        {subcategories.map((subcategory) => (
          <li key={subcategory.slug} className="w-[132px] shrink-0">
            <SubcategoryCard
              href={subcategory.href}
              label={subcategory.label}
              compact
            />
          </li>
        ))}
      </HorizontalScroll>

      <ul className="hidden gap-3 md:grid md:grid-cols-4 md:gap-4 lg:grid-cols-5">
        {subcategories.map((subcategory) => (
          <li key={subcategory.slug}>
            <SubcategoryCard
              href={subcategory.href}
              label={subcategory.label}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
