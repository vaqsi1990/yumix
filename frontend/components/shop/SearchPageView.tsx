"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import NavbarSearch from "@/components/shop/NavbarSearch";
import RestaurantsTileList from "@/components/RestaurantsTileList";
import { formatGel } from "@/lib/admin/format";
import { fetchShopSearch } from "@/lib/shop-api";
import type { ShopSearchResult } from "@/lib/restaurants";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() ?? "";
  const [results, setResults] = useState<ShopSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query) {
      setResults(null);
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    void fetchShopSearch(query)
      .then((data) => {
        if (cancelled) return;
        setResults(data);
      })
      .catch(() => {
        if (cancelled) return;
        setResults({ query, restaurants: [], products: [] });
        setError("ძებნა ვერ მოხერხდა. სცადე თავიდან.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  const restaurants = results?.restaurants ?? [];
  const products = results?.products ?? [];
  const hasResults = restaurants.length > 0 || products.length > 0;

  return (
    <>
      <div className="mt-4 max-w-2xl">
        <NavbarSearch
          variant="page"
          initialQuery={query}
          autoFocus={!query}
          showSuggestions
        />
      </div>

      {!query ? (
        <p className="mt-8 text-sm text-neutral-500">
          მოძებნე რესტორანი სახელით, კატეგორიით ან ქალაქით, ან კერძი სახელით.
        </p>
      ) : loading ? (
        <p className="mt-8 text-sm text-neutral-500">იძებნება...</p>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center text-sm text-red-700">
          {error}
        </div>
      ) : !hasResults ? (
        <div className="mt-8 rounded-2xl bg-[#F5F5F5] px-6 py-12 text-center">
          <p className="font-semibold text-neutral-900">
            „{query}“-ისთვის შედეგი ვერ მოიძებნა
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            სცადე სხვა სიტყვა ან გადაამოწმე მართლწერა.
          </p>
          <Link
            href="/restaurants"
            className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e00048]"
          >
            ყველა რესტორანი
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {restaurants.length > 0 ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold text-neutral-900">
                  რესტორნები
                </h2>
                <span className="text-sm text-neutral-500">
                  {restaurants.length}
                </span>
              </div>
              <RestaurantsTileList restaurants={restaurants} />
            </section>
          ) : null}

          {products.length > 0 ? (
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="text-lg font-bold text-neutral-900">კერძები</h2>
                <span className="text-sm text-neutral-500">
                  {products.length}
                </span>
              </div>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/restaurants/${product.restaurant.slug}`}
                      className="flex h-full gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition hover:border-[#FF0050]/30 hover:shadow-sm"
                    >
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-neutral-900">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-sm text-neutral-500">
                          {product.restaurant.name}
                        </p>
                        <p className="mt-2 font-semibold text-[#FF0050]">
                          {product.discountPrice != null &&
                          product.discountPrice < product.price ? (
                            <>
                              <span>{formatGel(product.discountPrice)}</span>
                              <span className="ml-2 text-xs font-normal text-neutral-400 line-through">
                                {formatGel(product.price)}
                              </span>
                            </>
                          ) : (
                            formatGel(product.price)
                          )}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}

export default function SearchPageView() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-5 lg:px-8">
      <h1 className="font-[family-name:var(--font-inter)] text-xl font-semibold text-neutral-900">
        ძებნა
      </h1>
      <Suspense
        fallback={
          <p className="mt-8 text-sm text-neutral-500">იტვირთება...</p>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
