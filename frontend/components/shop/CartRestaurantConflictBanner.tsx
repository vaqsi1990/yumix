"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-context";
import { clearCart as clearCartApi } from "@/lib/shop-api";
import { Button } from "@/components/ui/button";

type CartRestaurantConflictBannerProps = {
  restaurantId: string;
  restaurantName: string;
};

export default function CartRestaurantConflictBanner({
  restaurantId,
  restaurantName,
}: CartRestaurantConflictBannerProps) {
  const {
    ready,
    restaurantId: cartRestaurantId,
    restaurantName: cartRestaurantName,
    restaurantSlug: cartRestaurantSlug,
    totalQuantity,
    refresh,
  } = useCart();
  const [clearing, setClearing] = useState(false);

  const hasConflict =
    ready &&
    totalQuantity > 0 &&
    cartRestaurantId != null &&
    cartRestaurantId !== restaurantId;

  if (!hasConflict) return null;

  async function handleClear() {
    setClearing(true);
    try {
      await clearCartApi();
      await refresh();
    } finally {
      setClearing(false);
    }
  }

  const cartLabel = cartRestaurantName ?? "სხვა რესტორანი";
  const cartHref = cartRestaurantSlug
    ? `/restaurants/${cartRestaurantSlug}`
    : "/cart";

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-[#FF0050]/20 bg-[#FF0050]/5 px-4 py-3.5 text-sm text-neutral-800">
        <p className="font-medium">
          კალათაში გაქვს {totalQuantity} პროდუქტი რესტორანიდან „{cartLabel}“.
        </p>
        <p className="mt-1 text-neutral-600">
          „{restaurantName}“-დან დასამატებლად ჯერ გაასუფთავე კალათა ან დაასრულე
          წინა შეკვეთა.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/cart">შეკვეთის ნახვა</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={cartHref}>რესტორანის მენიუ</Link>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-[#FF0050] hover:text-[#e00048]"
            disabled={clearing}
            onClick={() => void handleClear()}
          >
            {clearing ? "იშლება..." : "კალათის გასუფთავება"}
          </Button>
        </div>
      </div>
    </div>
  );
}
