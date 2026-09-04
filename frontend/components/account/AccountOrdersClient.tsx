"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Headphones, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { formatGel } from "@/lib/admin/format";
import {
  ACTIVE_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/account/constants";
import ClientDateTime from "@/components/account/ClientDateTime";
import { reorderOrder, type CustomerOrder } from "@/lib/account-api";
import { Package } from "lucide-react";
import type { OrderStatus } from "@/lib/types";

function OrderCard({ order }: { order: CustomerOrder }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const preview = order.previewItems ?? [];
  const productNames = preview.map((i) => `${i.quantity}× ${i.product.name}`).join(", ");

  async function handleReorder() {
    setBusy(true);
    try {
      await reorderOrder(order.id);
      router.push("/cart");
    } catch (e) {
      alert(e instanceof Error ? e.message : "ხელახალი შეკვეთა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
          {order.restaurant.logo ? (
            <Image
              src={order.restaurant.logo}
              alt={order.restaurant.name}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-neutral-300">
              <Package className="size-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">#{order.orderNumber}</p>
              <p className="text-sm text-neutral-600">{order.restaurant.name}</p>
            </div>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium">
              {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
            </span>
          </div>
          {productNames && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{productNames}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
            <span><ClientDateTime value={order.createdAt} /></span>
            <span>{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
            {order.estimatedTime && ACTIVE_STATUSES.includes(order.status as OrderStatus) && (
              <span>~{order.estimatedTime} წთ</span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3">
        <p className="font-bold">{formatGel(order.total)}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href={`/account/help?order=${order.orderNumber}`}>
              <Headphones className="size-4" />
              დახმარება
            </Link>
          </Button>
          {order.status === "DELIVERED" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => void handleReorder()}>
              <RotateCcw className="size-4" />
              ხელახლა
            </Button>
          )}
          <Button size="sm" className="bg-[#FF0050] hover:bg-[#e00048]" asChild>
            <Link href={`/account/orders/${order.id}`}>დეტალები</Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function AccountOrdersClient({ orders }: { orders: CustomerOrder[] }) {
  const active = useMemo(
    () => orders.filter((o) => ACTIVE_STATUSES.includes(o.status as OrderStatus)),
    [orders],
  );
  const completed = useMemo(
    () => orders.filter((o) => o.status === "DELIVERED"),
    [orders],
  );
  const cancelled = useMemo(
    () => orders.filter((o) => o.status === "CANCELLED"),
    [orders],
  );

  return (
    <div>
      <AccountPageHeader title="ჩემი შეკვეთები" description="აქტიური და დასრულებული შეკვეთები" />

      <Tabs defaultValue="active">
        <TabsList className="mb-6 grid w-full grid-cols-3">
          <TabsTrigger value="active">აქტიური ({active.length})</TabsTrigger>
          <TabsTrigger value="completed">დასრულებული ({completed.length})</TabsTrigger>
          <TabsTrigger value="cancelled">გაუქმებული ({cancelled.length})</TabsTrigger>
        </TabsList>

        {[
          { key: "active", items: active, empty: "აქტიური შეკვეთა არ გაქვს" },
          { key: "completed", items: completed, empty: "დასრულებული შეკვეთა არ არის" },
          { key: "cancelled", items: cancelled, empty: "გაუქმებული შეკვეთა არ არის" },
        ].map(({ key, items, empty }) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {items.length === 0 ? (
              <AccountEmptyState
                icon={Package}
                title={empty}
                description="დაათვალიერე რესტორნები და შექმენი ახალი შეკვეთა"
                action={
                  <Button asChild className="bg-[#FF0050] hover:bg-[#e00048]">
                    <Link href="/restaurants">რესტორნების ნახვა</Link>
                  </Button>
                }
              />
            ) : (
              items.map((order) => <OrderCard key={order.id} order={order} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
