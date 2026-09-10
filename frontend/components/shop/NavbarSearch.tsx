"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { Search, Store, UtensilsCrossed } from "lucide-react";
import { fetchShopSearch } from "@/lib/shop-api";
import type { ShopSearchResult } from "@/lib/restaurants";
import { formatGel } from "@/lib/admin/format";

type NavbarSearchProps = {
  variant?: "header" | "page" | "inline";
  initialQuery?: string;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
};

const EMPTY_RESULTS: ShopSearchResult = {
  query: "",
  restaurants: [],
  products: [],
};

export default function NavbarSearch({
  variant = "header",
  initialQuery = "",
  className = "",
  autoFocus = false,
  showSuggestions = true,
}: NavbarSearchProps) {
  const router = useRouter();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ShopSearchResult>(EMPTY_RESULTS);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const navigate = useCallback(
    (query: string) => {
      const next = query.trim();
      setOpen(false);
      if (!next) {
        router.push("/search");
        return;
      }
      router.push(`/search?q=${encodeURIComponent(next)}`);
    },
    [router],
  );

  useEffect(() => {
    if (!showSuggestions) return;

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setResults(EMPTY_RESULTS);
      setOpen(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetchShopSearch(trimmed)
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => {
          setResults(EMPTY_RESULTS);
          setOpen(false);
        })
        .finally(() => setLoading(false));
    }, 280);

    return () => window.clearTimeout(timer);
  }, [value, showSuggestions]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    navigate(value);
  }

  const trimmed = value.trim();
  const showDropdown =
    showSuggestions && open && trimmed.length >= 2;

  const formClass =
    variant === "header"
      ? "flex w-full min-w-0 items-center gap-1 rounded-xl bg-white p-1 shadow-sm sm:gap-2 sm:p-1.5 md:w-[50%]"
      : variant === "inline"
        ? "flex w-full items-center gap-2"
        : "flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-sm";

  const inputClass =
    variant === "header"
      ? "w-full min-w-0 bg-transparent py-2 text-sm text-neutral-800 outline-none placeholder:text-neutral-400 sm:py-2.5 sm:text-[0.95rem]"
      : variant === "inline"
        ? "h-9 min-w-0 w-full rounded-md border border-input bg-background py-1 pl-9 pr-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground"
        : "min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-neutral-800 outline-none placeholder:text-neutral-400";

  const buttonClass =
    variant === "header"
      ? "shrink-0 rounded-lg bg-[#FF0050] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#e60048] sm:px-6 sm:py-2.5 sm:text-sm"
      : variant === "inline"
        ? "hidden"
        : "shrink-0 rounded-lg bg-[#FF0050] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#e60048]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <form onSubmit={onSubmit} className={formClass} role="search">
        <div
          className={
            variant === "header"
              ? "flex min-w-0 flex-1 items-center gap-1.5 px-2 sm:gap-2 sm:px-3"
              : variant === "inline"
                ? "relative min-w-0 flex-1"
                : "flex min-w-0 flex-1 items-center gap-2 px-2"
          }
        >
          {variant === "inline" ? (
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          ) : (
            <Search
              className={
                variant === "header"
                  ? "size-4 shrink-0 text-[#FF0050] sm:size-5"
                  : "size-4 shrink-0 text-neutral-400"
              }
            />
          )}
          <input
            type="search"
            name="q"
            value={value}
            autoFocus={autoFocus}
            autoComplete="off"
            aria-label="ძებნა"
            aria-expanded={showDropdown}
            aria-controls={showDropdown ? listboxId : undefined}
            placeholder="რესტორანი, კერძი..."
            className={inputClass}
            onChange={(event) => setValue(event.target.value)}
            onFocus={() => {
              if (value.trim().length >= 2 && results.query) {
                setOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") setOpen(false);
            }}
          />
        </div>
        {variant !== "inline" ? (
          <button type="submit" className={buttonClass}>
            ძებნა
          </button>
        ) : null}
      </form>

      {showDropdown ? (
        <div
          id={listboxId}
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[60] overflow-hidden rounded-2xl border border-neutral-200 bg-white text-neutral-900 shadow-xl"
        >
          {loading ? (
            <p className="px-4 py-3 text-sm text-neutral-500">იძებნება...</p>
          ) : (
            <div className="max-h-[min(24rem,70vh)] overflow-y-auto py-2">
              {!loading &&
              results.restaurants.length === 0 &&
              results.products.length === 0 ? (
                <p className="px-4 py-3 text-sm text-neutral-500">
                  შედეგი ვერ მოიძებნა
                </p>
              ) : null}
              {results.restaurants.length > 0 ? (
                <section className="px-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    რესტორნები
                  </p>
                  <ul>
                    {results.restaurants.slice(0, 4).map((restaurant) => (
                      <li key={restaurant.id}>
                        <Link
                          href={`/restaurants/${restaurant.slug}`}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-neutral-50"
                          onClick={() => setOpen(false)}
                        >
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                            {restaurant.logo ? (
                              <Image
                                src={restaurant.logo}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <Store className="m-2 size-6 text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-neutral-900">
                              {restaurant.name}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {restaurant.categories} · {restaurant.city}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {results.products.length > 0 ? (
                <section className="mt-1 px-2">
                  <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                    კერძები
                  </p>
                  <ul>
                    {results.products.slice(0, 4).map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/restaurants/${product.restaurant.slug}`}
                          className="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-neutral-50"
                          onClick={() => setOpen(false)}
                        >
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            ) : (
                              <UtensilsCrossed className="m-2 size-6 text-neutral-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-neutral-900">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {product.restaurant.name}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold text-[#FF0050]">
                            {formatGel(
                              product.discountPrice ?? product.price,
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <div className="border-t border-neutral-100 px-2 pt-2">
                <button
                  type="button"
                  className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#FF0050] transition hover:bg-[#FF0050]/5"
                  onClick={() => navigate(value)}
                >
                  ყველა შედეგის ნახვა
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
