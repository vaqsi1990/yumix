import Image from "next/image";
import Link from "next/link";
import { formatGel } from "@/lib/admin/format";
import type { PublicOffer } from "@/lib/offers";

export default function OfferCard({ offer }: { offer: PublicOffer }) {
  const discountPercent = Math.round(
    ((offer.price - offer.discountPrice) / offer.price) * 100,
  );

  return (
    <Link
      href={`/restaurants/${offer.restaurant.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-[0_0_4px_0_rgba(0,0,0,0.06)] transition hover:border-[#FF0050]/20 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {offer.image ? (
          <Image
            src={offer.image}
            alt={offer.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-neutral-400">
            —
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[#FF0050] px-2.5 py-1 text-[14px] font-semibold text-white">
          −{discountPercent}%
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[14px] font-medium text-[#FF0050]">
          {offer.restaurant.name}
        </p>
        <h3 className="mt-1 font-[family-name:var(--font-inter)] text-[16px] font-bold text-neutral-900 md:text-[18px]">
          {offer.name}
        </h3>
        {offer.description && (
          <p className="mt-1 line-clamp-2 text-[14px] text-neutral-500 md:text-[16px]">
            {offer.description}
          </p>
        )}
        <div className="mt-auto flex items-baseline gap-2 pt-3">
          <span className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900">
            {formatGel(offer.discountPrice)}
          </span>
          <span className="text-[14px] text-neutral-400 line-through md:text-[16px]">
            {formatGel(offer.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
