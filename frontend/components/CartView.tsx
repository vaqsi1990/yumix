"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type CartViewData = {
  id: string;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    deliveryFee: number | null;
    minimumOrder: number | null;
    logo: string | null;
  };
  coupon: {
    id: string;
    code: string;
    remainingBalance: number;
    expiresAt: string | Date | null;
  } | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      image: string | null;
      isAvailable: boolean;
    };
    variant: { id: string; name: string; price: number } | null;
    addOns: {
      id: string;
      quantity: number;
      price: number;
      addon: { id: string; name: string };
    }[];
  }[];
};

type Totals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
};

function formatGel(amount: number) {
  return `₾${amount.toFixed(2)}`;
}

function itemLineTotal(item: CartViewData["items"][number]) {
  const addOns = item.addOns.reduce(
    (sum, addon) => sum + addon.price * addon.quantity,
    0,
  );
  return item.price * item.quantity + addOns;
}

export default function CartView({
  cart,
  totals,
}: {
  cart: CartViewData | null;
  totals: Totals | null;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");

  async function updateQuantity(itemId: string, quantity: number) {
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/backend/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/backend/cart/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function clearCart() {
    if (!window.confirm("კალათის გასუფთავება გინდა?")) return;
    setClearing(true);
    try {
      const res = await fetch("/api/backend/cart", { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setClearing(false);
    }
  }

  async function applyCoupon() {
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch("/api/backend/cart/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCouponError(data.error || "კუპონი ვერ გამოიყენა");
        return;
      }
      setCouponCode("");
      router.refresh();
    } finally {
      setCouponBusy(false);
    }
  }

  async function removeCoupon() {
    setCouponBusy(true);
    setCouponError("");
    try {
      const res = await fetch("/api/backend/cart/coupon", { method: "DELETE" });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setCouponBusy(false);
    }
  }

  if (!cart || cart.items.length === 0 || !totals) {
    return (
      <div className="rounded-2xl bg-[#F5F5F5] px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white text-[#FF0050]">
          <svg
            className="size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6h15l-1.5 9h-12L5 3H2"
            />
            <circle cx="9" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
        </div>
        <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
          კალათა ცარიელია
        </h2>
        <p className="mt-2 text-[16px] text-neutral-500 md:text-[18px]">
          დაამატე კერძები რესტორნიდან
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-lg bg-[#FF0050] px-5 py-2.5 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px]"
        >
          რესტორნების ნახვა
        </Link>
      </div>
    );
  }

  const belowMinimum =
    cart.restaurant.minimumOrder != null &&
    totals.subtotal < cart.restaurant.minimumOrder;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">რესტორანი</p>
            <Link
              href={`/restaurants/${cart.restaurant.slug}`}
              className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 hover:text-[#FF0050] md:text-[20px]"
            >
              {cart.restaurant.name}
            </Link>
          </div>
          <button
            type="button"
            onClick={clearCart}
            disabled={clearing}
            className="text-[16px] text-neutral-500 underline-offset-2 hover:text-[#FF0050] hover:underline disabled:opacity-50 md:text-[18px]"
          >
            გასუფთავება
          </button>
        </div>

        <ul className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white">
          {cart.items.map((item) => (
            <li key={item.id} className="flex gap-3 px-4 py-4 sm:gap-4">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F5] sm:size-20">
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-neutral-300">
                    <svg
                      className="size-8"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M12 2C8 2 5 5.5 5 10c0 5 7 12 7 12s7-7 7-12c0-4.5-3-8-7-8Z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-[family-name:var(--font-inter)] text-[16px] font-semibold text-neutral-900 md:text-[18px]">
                      {item.product.name}
                    </h3>
                    {item.variant && (
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {item.variant.name}
                      </p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="mt-0.5 text-sm text-neutral-400">
                        {item.addOns
                          .map((a) => a.addon.name)
                          .join(", ")}
                      </p>
                    )}
                    {!item.product.isAvailable && (
                      <p className="mt-1 text-sm text-[#FF0050]">
                        დროებით მიუწვდომელია
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 font-semibold text-neutral-900">
                    {formatGel(itemLineTotal(item))}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-lg border border-neutral-200">
                    <button
                      type="button"
                      disabled={busyId === item.id || item.quantity <= 1}
                      onClick={() =>
                        updateQuantity(item.id, item.quantity - 1)
                      }
                      className="px-3 py-1.5 text-lg leading-none text-neutral-700 disabled:opacity-40"
                      aria-label="შემცირება"
                    >
                      −
                    </button>
                    <span className="min-w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={busyId === item.id || item.quantity >= 99}
                      onClick={() =>
                        updateQuantity(item.id, item.quantity + 1)
                      }
                      className="px-3 py-1.5 text-lg leading-none text-neutral-700 disabled:opacity-40"
                      aria-label="გაზრდა"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => removeItem(item.id)}
                    className="inline-flex size-9 items-center justify-center rounded-md text-[#FF0050] transition hover:bg-[#FF0050]/10 disabled:opacity-40"
                    aria-label="წაშლა"
                  >
                    <svg
                      className="size-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="h-fit rounded-2xl border border-neutral-200 bg-[#F5F5F5] p-5 lg:sticky lg:top-4">
        <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
          შეჯამება
        </h2>

        <div className="mt-4">
          <p className="mb-2 text-sm text-neutral-500">კუპონი</p>
          {cart.coupon ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">
                  {cart.coupon.code}
                </p>
                <p className="text-sm text-neutral-500">
                  ბალანსი: {formatGel(cart.coupon.remainingBalance)}
                </p>
              </div>
              <button
                type="button"
                disabled={couponBusy}
                onClick={removeCoupon}
                className="shrink-0 text-sm text-[#FF0050] hover:underline disabled:opacity-50"
              >
                მოხსნა
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="კოდი"
                className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[16px] outline-none focus:border-[#FF0050] focus:ring-2 focus:ring-[#FF0050]/20 md:text-[18px]"
              />
              <button
                type="button"
                disabled={couponBusy || !couponCode.trim()}
                onClick={applyCoupon}
                className="rounded-lg bg-neutral-900 px-3 py-2.5 text-[16px] font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50 md:text-[18px]"
              >
                გამოყენება
              </button>
            </div>
          )}
          {couponError && (
            <p className="mt-2 text-sm text-[#FF0050]">{couponError}</p>
          )}
        </div>

        <dl className="mt-4 space-y-2 text-[16px] md:text-[18px]">
          <div className="flex justify-between gap-3 text-neutral-600">
            <dt>ქვეჯამი ({totals.itemCount})</dt>
            <dd>{formatGel(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-neutral-600">
            <dt>მიწოდება</dt>
            <dd>
              {totals.deliveryFee === 0
                ? "უფასო"
                : formatGel(totals.deliveryFee)}
            </dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between gap-3 text-[#15803D]">
              <dt>კუპონის ფასდაკლება</dt>
              <dd>−{formatGel(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-neutral-200 pt-3 font-bold text-neutral-900">
            <dt>სულ</dt>
            <dd>{formatGel(totals.total)}</dd>
          </div>
        </dl>

        {belowMinimum && (
          <p className="mt-3 text-sm text-[#FF0050]">
            მინიმალური შეკვეთა:{" "}
            {formatGel(cart.restaurant.minimumOrder ?? 0)}
          </p>
        )}

        <button
          type="button"
          disabled={belowMinimum}
          className="mt-5 w-full rounded-lg bg-[#FF0050] px-4 py-3 text-[16px] font-medium text-white transition hover:bg-[#e00048] disabled:cursor-not-allowed disabled:opacity-50 md:text-[18px]"
        >
          შეკვეთის გაფორმება
        </button>
        <p className="mt-2 text-center text-xs text-neutral-400">
          Checkout მალე დაემატება
        </p>
      </aside>
    </div>
  );
}
