"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Package, RotateCcw, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { formatGel } from "@/lib/admin/format";
import { formatAddressLine, ORDER_STATUS_LABELS } from "@/lib/account/constants";
import { reorderOrder, type DashboardData } from "@/lib/account-api";
import type { OrderStatus } from "@/lib/types";

function RestaurantMiniCard({
  restaurant,
}: {
  restaurant: DashboardData["favoriteRestaurants"][number];
}) {
  const image = restaurant.coverImage || restaurant.logo || "/yumix-logo.svg";
  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:shadow-md"
    >
      <div className="relative h-28 bg-neutral-100">
        <Image src={image} alt={restaurant.name} fill sizes="200px" className="object-cover" />
        {!restaurant.isOpen && (
          <span className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            დახურული
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-semibold group-hover:text-[#FF0050]">
          {restaurant.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {restaurant.categories || "—"} · ★ {restaurant.rating}
        </p>
        <p className="mt-1 text-xs text-neutral-400">{restaurant.deliveryTime}</p>
      </div>
    </Link>
  );
}

export default function AccountDashboardClient({
  data,
}: {
  data: DashboardData;
}) {
  const router = useRouter();
  const name = data.user.firstName;

  async function handleReorder(orderId: string) {
    try {
      await reorderOrder(orderId);
      router.push("/cart");
    } catch (e) {
      alert(e instanceof Error ? e.message : "ხელახალი შეკვეთა ვერ მოხერხდა");
    }
  }

  return (
    <div>
      <AccountPageHeader
        title={`გამარჯობა, ${name}!`}
        description="აქ ნახავ შენს შეკვეთებს, რჩეულებს და სწრაფ მოქმედებებს"
      />

      {data.defaultAddress && (
        <div className="mb-6 flex items-start gap-2 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-[#FF0050]" />
          <div>
            <p className="font-medium text-neutral-900">მიმდინარე მისამართი</p>
            <p className="text-neutral-500">{formatAddressLine(data.defaultAddress)}</p>
          </div>
          <Link
            href="/account/addresses"
            className="ml-auto shrink-0 text-sm font-medium text-[#FF0050] hover:underline"
          >
            შეცვლა
          </Link>
        </div>
      )}

      {data.activeOrder && (
        <Card className="mb-6 border-[#FF0050]/20 bg-gradient-to-r from-[#FF0050]/5 to-white">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#FF0050]">აქტიური შეკვეთა</p>
              <p className="mt-1 text-lg font-bold">{data.activeOrder.restaurant.name}</p>
              <p className="text-sm text-neutral-600">
                {ORDER_STATUS_LABELS[data.activeOrder.status as OrderStatus] ??
                  data.activeOrder.status}
                {data.activeOrder.estimatedTime
                  ? ` · ~${data.activeOrder.estimatedTime} წთ`
                  : ""}
              </p>
            </div>
            <Button asChild className="bg-[#FF0050] hover:bg-[#e00048]">
              <Link href={`/account/orders/${data.activeOrder.id}`}>შეკვეთის ნახვა</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">ბოლო შეკვეთები</h2>
          <Link href="/account/orders" className="text-sm text-[#FF0050] hover:underline">
            ყველა →
          </Link>
        </div>
        {data.recentOrders.length === 0 ? (
          <AccountEmptyState
            icon={Package}
            title="შეკვეთები ჯერ არ გაქვს"
            description="დაათვალიერე რესტორნები და გააკეთე პირველი შეკვეთა"
            action={
              <Button asChild className="bg-[#FF0050] hover:bg-[#e00048]">
                <Link href="/restaurants">რესტორნების ნახვა</Link>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold">#{order.orderNumber}</p>
                  <p className="text-sm text-neutral-500">{order.restaurant.name}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    {new Date(order.createdAt).toLocaleString("ka-GE")} ·{" "}
                    {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold">{formatGel(order.total)}</p>
                  {order.status === "DELIVERED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleReorder(order.id)}
                    >
                      <RotateCcw className="size-4" />
                      ხელახლა
                    </Button>
                  )}
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/account/orders/${order.id}`}>დეტალები</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {data.favoriteRestaurants.length > 0 && (
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">რჩეული რესტორნები</h2>
            <Link href="/account/favorites" className="text-sm text-[#FF0050] hover:underline">
              ყველა →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.favoriteRestaurants.slice(0, 3).map((r) => (
              <RestaurantMiniCard key={r.id} restaurant={r} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">რეკომენდებული</h2>
          <Link href="/restaurants" className="text-sm text-[#FF0050] hover:underline">
            ყველა →
          </Link>
        </div>
        {data.recommendedRestaurants.length === 0 ? (
          <AccountEmptyState
            icon={Store}
            title="რესტორნები მალე გამოჩნდება"
            description="სცადე მთავარ გვერდზე დაბრუნება"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommendedRestaurants.map((r) => (
              <RestaurantMiniCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
