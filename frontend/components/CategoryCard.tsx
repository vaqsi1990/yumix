import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

function OtherIcon({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full ${
        compact ? "size-14" : "size-16 sm:size-[70px]"
      }`}
      style={{
        background:
          "radial-gradient(circle, rgba(255,0,80,0.22) 0%, rgba(255,0,80,0.08) 55%, rgba(255,0,80,0) 72%)",
      }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-[#FF0050] sm:size-2" />
        <span className="size-1.5 rounded-full bg-[#FF0050] sm:size-2" />
        <span className="size-1.5 rounded-full bg-[#FF0050] sm:size-2" />
      </div>
    </div>
  );
}

export default function CategoryCard({
  href,
  label,
  image,
  description,
  compact = false,
  list = false,
  labelSingleLine = false,
}: {
  href: string;
  label: string;
  image: string | null;
  description?: string;
  compact?: boolean;
  list?: boolean;
  labelSingleLine?: boolean;
}) {
  const isLogoTile = compact && labelSingleLine;

  return (
    <Link
      href={href}
      className={
        list
          ? "flex min-h-[72px] w-full items-center gap-3 rounded-2xl bg-[#F5F5F5] px-4 py-3 transition hover:bg-[#EFEFEF] md:min-h-[160px] md:flex-col md:items-center md:justify-center md:gap-2.5 md:px-3 md:py-5 md:text-center"
          : isLogoTile
            ? "group flex w-full flex-col items-center gap-2 text-center"
            : compact
              ? "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl bg-[#F5F5F5] px-2 py-3 text-center transition hover:bg-[#EFEFEF]"
              : "flex h-full min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#F5F5F5] px-3 py-5 text-center transition hover:bg-[#EFEFEF] sm:min-h-[160px]"
      }
    >
      {isLogoTile ? (
        image ? (
          <span className="relative block aspect-square w-full overflow-hidden rounded-2xl bg-[#F5F5F5] transition group-hover:bg-[#EFEFEF]">
            <Image
              src={image}
              alt=""
              fill
              sizes="(max-width: 768px) 112px, 160px"
              className="object-cover"
            />
          </span>
        ) : (
          <span className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[#F5F5F5] transition group-hover:bg-[#EFEFEF]">
            <OtherIcon compact />
          </span>
        )
      ) : image ? (
        <span
          className={`relative block shrink-0 overflow-hidden rounded-xl ${
            list
              ? "size-12 md:size-16 lg:size-[72px]"
              : compact
                ? "size-14"
                : "size-16 sm:size-[72px]"
          }`}
        >
          <Image
            src={image}
            alt={label}
            fill
            sizes="72px"
            className="object-cover"
          />
        </span>
      ) : (
        <OtherIcon compact={list || compact} />
      )}
      <span
        className={cn(
          "font-[family-name:var(--font-inter)] font-normal not-italic text-neutral-900",
          isLogoTile
            ? "w-full min-w-0 truncate px-0.5 text-[16px] leading-snug md:text-[18px]"
            : "text-[16px] leading-snug md:text-[18px]",
        )}
      >
        {label}
      </span>
     
    </Link>
  );
}
