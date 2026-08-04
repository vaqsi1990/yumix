import Link from "next/link";
import OfferCard from "@/components/OfferCard";
import { getPublicOffers } from "@/lib/offers";

export const dynamic = "force-dynamic";

export default async function OffersPage() {
  let offers: Awaited<ReturnType<typeof getPublicOffers>>["offers"] = [];

  try {
    const data = await getPublicOffers();
    offers = data.offers;
  } catch {
    offers = [];
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
          აქციები
        </h1>
        {offers.length > 0 && (
          <p className="mt-1 text-[16px] text-neutral-500 md:text-[18px]">
            {offers.length} აქცია
          </p>
        )}
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
            ამჟამად აქცია არ არის ხელმისაწვდომი
          </h2>
          <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
            ახალი აქციები მალე გამოჩნდება
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
          >
            მთავარ გვერდზე დაბრუნება
          </Link>
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
