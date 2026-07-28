import Image from "next/image";
import Link from "next/link";

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
}: {
  href: string;
  label: string;
  image: string | null;
  description?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        compact
          ? "flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl bg-[#F5F5F5] px-2 py-3 text-center transition hover:bg-[#EFEFEF]"
          : "flex h-full min-h-[140px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#F5F5F5] px-3 py-5 text-center transition hover:bg-[#EFEFEF] sm:min-h-[160px]"
      }
    >
      {image ? (
        <span
          className={`relative block overflow-hidden rounded-xl ${
            compact ? "size-14" : "size-16 sm:size-[72px]"
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
        <OtherIcon compact={compact} />
      )}
      <span className="font-[family-name:var(--font-inter)] text-[16px] font-normal not-italic leading-snug text-neutral-900 md:text-[18px]">
        {label}
      </span>
      {description && !compact && (
        <span className="line-clamp-2 text-sm text-neutral-400">
          {description}
        </span>
      )}
    </Link>
  );
}
