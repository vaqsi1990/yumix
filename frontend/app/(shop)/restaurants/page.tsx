import Link from "next/link";
import RestaurantCard from "@/components/RestaurantCard";
import SearchBox from "@/components/SearchBox";
import { getPublicRestaurants } from "@/lib/restaurants";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function RestaurantsPage({ searchParams }: Props) {
  const { q } = await searchParams;

  let restaurants: Awaited<
    ReturnType<typeof getPublicRestaurants>
  >["restaurants"] = [];
  let fromDatabase = false;
  let pendingCount = 0;

  try {
    const data = await getPublicRestaurants(q);
    restaurants = data.restaurants;
    fromDatabase = data.fromDatabase;
    pendingCount = data.pendingCount ?? 0;
  } catch {
    restaurants = [];
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-5 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-[family-name:var(--font-inter)] text-[22px] font-bold text-neutral-900 md:text-[28px]">
            რესტორნები
          </h1>
          <p className="mt-1 text-[16px] text-neutral-500 md:text-[18px]">
            {restaurants.length} რესტორანი
          </p>
        </div>

        <SearchBox
          basePath="/restaurants"
          initialQuery={q ?? ""}
          placeholder="ძებნა სახელით ან ქალაქით"
        />
      </div>

      {restaurants.length === 0 ? (
        <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
          <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
            {pendingCount > 0
              ? "დამტკიცებული რესტორნები ჯერ არ არის"
              : "რესტორანი ვერ მოიძებნა"}
          </h2>
          <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
            {pendingCount > 0
              ? `${pendingCount} რესტორანი დამტკიცების მოლოდინშია. ადმინისტრატორი დაამტკიცებს და გამოჩნდება აქ.`
              : fromDatabase
                ? "სცადე სხვა საძიებო სიტყვა"
                : "ჯერ არ არის დამატებული რესტორნები"}
          </p>
          {pendingCount > 0 ? (
            <Link
              href="/restaurant/dashboard"
              className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
            >
              მფლობელის პანელი
            </Link>
          ) : (
            <Link
              href="/restaurants"
              className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
            >
              ყველას ნახვა
            </Link>
          )}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
