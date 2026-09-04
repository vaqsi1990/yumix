"use client";

import Link from "next/link";
import { formatGel } from "@/lib/admin/format";
import { useCart } from "@/components/cart-context";
import { cn } from "@/lib/utils";

type ViewOrderBarProps = {
  restaurantId: string;
  hidden?: boolean;
  className?: string;
};

export default function ViewOrderBar({
  restaurantId,
  hidden = false,
  className,
}: ViewOrderBarProps) {
  const { ready, restaurantId: cartRestaurantId, totalQuantity, subtotal } =
    useCart();

  const visible =
    !hidden &&
    ready &&
    totalQuantity > 0 &&
    cartRestaurantId === restaurantId;

  if (!visible) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4",
        "bottom-[var(--view-order-bar-bottom)] md:bottom-0 md:pb-[max(1rem,var(--safe-area-bottom))]",
        className,
      )}
    >
      <Link
        href="/cart"
        className="pointer-events-auto flex h-[var(--view-order-bar-height)] w-full max-w-lg items-center gap-3 rounded-2xl bg-[#FF0050] px-4 font-[family-name:var(--font-inter)] text-white shadow-[0_4px_24px_rgba(255,0,80,0.35)] transition active:scale-[0.98] sm:gap-4 sm:px-5"
        aria-label={`შეკვეთის ნახვა, ${totalQuantity} ნივთი, ${formatGel(subtotal)}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#FF0050]">
          {totalQuantity > 99 ? "99+" : totalQuantity}
        </span>
        <span className="flex-1 text-center text-[15px] font-semibold sm:text-base">
          შეკვეთის ნახვა
        </span>
        <span className="shrink-0 text-[15px] font-bold tabular-nums sm:text-base">
          {formatGel(subtotal)}
        </span>
      </Link>
    </div>
  );
}

export function useViewOrderBarVisible(restaurantId: string) {
  const { ready, restaurantId: cartRestaurantId, totalQuantity } = useCart();
  return (
    ready && totalQuantity > 0 && cartRestaurantId === restaurantId
  );
}
