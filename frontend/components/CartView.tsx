"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CartQuickExtras from "@/components/shop/CartQuickExtras";
import { syncCartFromResponse, useCart } from "@/components/cart-context";
import { ADDON_CARRIER_PRODUCT_NAME } from "@/lib/addon-categories";
import type { AddonCategory } from "@/lib/addon-categories";
import { sortVariantsBySize } from "@/lib/product-sizes";

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
      variants?: { id: string; name: string; price: number }[];
    };
    variant: { id: string; name: string; price: number } | null;
    addOns: {
      id: string;
      quantity: number;
      price: number;
      addon: { id: string; name: string };
    }[];
    customizations?: {
      id: string;
      quantity: number;
      price: number;
      option: {
        id: string;
        name: string;
        group: { id: string; name: string };
      };
    }[];
  }[];
  addOns?: {
    id: string;
    name: string;
    price: number;
    category?: AddonCategory;
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
  const customizations = (item.customizations ?? []).reduce(
    (sum, row) => sum + row.price * row.quantity,
    0,
  );
  return item.price * item.quantity + addOns + customizations;
}

function getItemTitle(item: CartViewData["items"][number]) {
  if (
    item.product.name === ADDON_CARRIER_PRODUCT_NAME &&
    item.addOns.length > 0
  ) {
    return item.addOns.map((a) => a.addon.name).join(", ");
  }
  return item.product.name;
}

function recalcTotals(cart: CartViewData, previous: Totals): Totals {
  const subtotal = cart.items.reduce((sum, item) => sum + itemLineTotal(item), 0);
  const deliveryFee = previous.deliveryFee;
  const discount = Math.min(previous.discount, subtotal + deliveryFee);
  return {
    subtotal,
    deliveryFee,
    discount,
    total: Math.max(0, subtotal + deliveryFee - discount),
    itemCount: cart.items.length,
  };
}

function withItemVariant(
  cart: CartViewData,
  itemId: string,
  variantId: string,
): CartViewData {
  return {
    ...cart,
    items: cart.items.map((item) => {
      if (item.id !== itemId) return item;
      const variant = item.product.variants?.find((row) => row.id === variantId);
      if (!variant) return item;
      return { ...item, variant, price: variant.price };
    }),
  };
}

function withItemQuantity(
  cart: CartViewData,
  itemId: string,
  quantity: number,
): CartViewData {
  return {
    ...cart,
    items: cart.items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    ),
  };
}

export default function CartView({
  cart,
  totals,
}: {
  cart: CartViewData | null;
  totals: Totals | null;
}) {
  const router = useRouter();
  const { setItemCount } = useCart();
  const [localCart, setLocalCart] = useState(cart);
  const [localTotals, setLocalTotals] = useState(totals);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState("");
  const requestSeq = useRef(0);

  useEffect(() => {
    setLocalCart(cart);
    setLocalTotals(totals);
  }, [cart, totals]);

  function applyCartPayload(data: {
    cart?: CartViewData | null;
    totals?: Totals | null;
  }) {
    if (data.cart !== undefined) setLocalCart(data.cart);
    if (data.totals !== undefined) setLocalTotals(data.totals);
    setItemCount(syncCartFromResponse(data));
  }

  async function updateItem(
    itemId: string,
    payload: { quantity?: number; variantId?: string },
  ) {
    if (payload.variantId && localCart) {
      const nextCart = withItemVariant(localCart, itemId, payload.variantId);
      setLocalCart(nextCart);
      if (localTotals) setLocalTotals(recalcTotals(nextCart, localTotals));
    } else if (payload.quantity !== undefined && localCart) {
      const nextCart = withItemQuantity(localCart, itemId, payload.quantity);
      setLocalCart(nextCart);
      if (localTotals) setLocalTotals(recalcTotals(nextCart, localTotals));
      setBusyId(itemId);
    } else {
      setBusyId(itemId);
    }

    const seq = ++requestSeq.current;
    try {
      const res = await fetch(`/api/backend/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setLocalCart(cart);
        setLocalTotals(totals);
        return;
      }
      const data = (await res.json()) as {
        cart?: CartViewData | null;
        totals?: Totals | null;
      };
      if (seq !== requestSeq.current) return;
      applyCartPayload(data);
    } finally {
      if (seq === requestSeq.current) setBusyId(null);
    }
  }

  async function removeItem(itemId: string) {
    setBusyId(itemId);
    try {
      const res = await fetch(`/api/backend/cart/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      const data = await res.json();
      setItemCount(syncCartFromResponse(data));
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
      setItemCount(0);
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

  if (!localCart || localCart.items.length === 0 || !localTotals) {
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
    localCart.restaurant.minimumOrder != null &&
    localTotals.subtotal < localCart.restaurant.minimumOrder;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-neutral-500">რესტორანი</p>
            <Link
              href={`/restaurants/${localCart.restaurant.slug}`}
              className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 hover:text-[#FF0050] md:text-[20px]"
            >
              {localCart.restaurant.name}
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
          {localCart.items.map((item) => (
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
                      {getItemTitle(item)}
                    </h3>
                    {item.product.name !== ADDON_CARRIER_PRODUCT_NAME &&
                      (item.product.variants?.length ?? 0) > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sortVariantsBySize(item.product.variants ?? []).map(
                          (variant) => {
                            const selected = item.variant?.id === variant.id;
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                disabled={selected}
                                onClick={() =>
                                  updateItem(item.id, {
                                    variantId: variant.id,
                                  })
                                }
                                className={`rounded-md border px-2 py-0.5 text-[14px] font-medium transition md:text-[16px] ${
                                  selected
                                    ? "border-[#FF0050] bg-[#FF0050] text-white"
                                    : "border-neutral-200 bg-white text-neutral-700 hover:border-[#FF0050]/50"
                                }`}
                              >
                                {variant.name}
                              </button>
                            );
                          },
                        )}
                      </div>
                    )}
                    {item.product.name !== ADDON_CARRIER_PRODUCT_NAME &&
                      !item.product.variants?.length &&
                      item.variant && (
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {item.variant.name}
                      </p>
                    )}
                    {item.product.name !== ADDON_CARRIER_PRODUCT_NAME &&
                      item.addOns.length > 0 && (
                      <p className="mt-0.5 text-sm text-neutral-400">
                        {item.addOns
                          .map((a) =>
                            a.quantity > 1
                              ? `${a.addon.name} ×${a.quantity}`
                              : a.addon.name,
                          )
                          .join(", ")}
                      </p>
                    )}
                    {item.product.name !== ADDON_CARRIER_PRODUCT_NAME &&
                      (item.customizations?.length ?? 0) > 0 && (
                      <p className="mt-0.5 text-sm text-neutral-400">
                        {(item.customizations ?? [])
                          .map((c) => {
                            const label = `${c.option.group.name}: ${c.option.name}`;
                            return c.quantity > 1 ? `${label} ×${c.quantity}` : label;
                          })
                          .join(" · ")}
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
                        updateItem(item.id, { quantity: item.quantity - 1 })
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
                        updateItem(item.id, { quantity: item.quantity + 1 })
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

        {localCart.addOns && localCart.addOns.length > 0 && (
          <CartQuickExtras addOns={localCart.addOns} />
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-neutral-200 bg-[#F5F5F5] p-5 lg:sticky lg:top-4">
        <h2 className="font-[family-name:var(--font-inter)] text-[18px] font-bold text-neutral-900 md:text-[20px]">
          შეჯამება
        </h2>

        <div className="mt-4">
          <p className="mb-2 text-sm text-neutral-500">კუპონი</p>
          {localCart.coupon ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-semibold text-neutral-900">
                  {localCart.coupon.code}
                </p>
                <p className="text-sm text-neutral-500">
                  ბალანსი: {formatGel(localCart.coupon.remainingBalance)}
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
            <dt>ქვეჯამი ({localTotals.itemCount})</dt>
            <dd>{formatGel(localTotals.subtotal)}</dd>
          </div>
          <div className="flex justify-between gap-3 text-neutral-600">
            <dt>მიწოდება</dt>
            <dd>
              {localTotals.deliveryFee === 0
                ? "უფასო"
                : formatGel(localTotals.deliveryFee)}
            </dd>
          </div>
          {localTotals.discount > 0 && (
            <div className="flex justify-between gap-3 text-[#15803D]">
              <dt>კუპონის ფასდაკლება</dt>
              <dd>−{formatGel(localTotals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 border-t border-neutral-200 pt-3 font-bold text-neutral-900">
            <dt>სულ</dt>
            <dd>{formatGel(localTotals.total)}</dd>
          </div>
        </dl>

        {belowMinimum && (
          <p className="mt-3 text-sm text-[#FF0050]">
            მინიმალური შეკვეთა:{" "}
            {formatGel(localCart.restaurant.minimumOrder ?? 0)}
          </p>
        )}

        <Link
          href="/checkout"
          className={`mt-5 flex w-full items-center justify-center rounded-lg bg-[#FF0050] px-4 py-3 text-[16px] font-medium text-white transition hover:bg-[#e00048] md:text-[18px] ${
            belowMinimum
              ? "pointer-events-none cursor-not-allowed opacity-50"
              : ""
          }`}
        >
          შეკვეთის გაფორმება
        </Link>
        <p className="mt-2 text-center text-xs text-neutral-400">
          სავარაუდო მიწოდება: 35-55 წთ
        </p>
      </aside>
    </div>
  );
}
