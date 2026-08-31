"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Headphones, Phone, RotateCcw } from "lucide-react";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/button";
import { formatGel } from "@/lib/admin/format";
import {
  ACTIVE_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/account/constants";
import { reorderOrder } from "@/lib/account-api";
import type { OrderStatus } from "@/lib/types";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedTime: number | null;
  customerNote: string | null;
  createdAt: string;
  restaurant: { name: string; slug: string; phone: string; logo?: string | null };
  courier: {
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  address: {
    city: string;
    street: string;
    building: string | null;
    apartment: string | null;
    deliveryNote: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    product: { name: string; image: string | null };
    variant: { name: string } | null;
    addOns: Array<{ addon: { name: string }; quantity: number; price: number }>;
    customizations?: Array<{
      groupName: string;
      optionName: string;
      quantity: number;
      price: number;
    }>;
  }>;
};

export default function AccountOrderDetailClient({
  initialOrder,
  showSuccess,
}: {
  initialOrder: OrderDetail;
  showSuccess?: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const [reorderBusy, setReorderBusy] = useState(false);
  const isActive = ACTIVE_STATUSES.includes(order.status as OrderStatus);

  useEffect(() => {
    if (!isActive) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/backend/orders/${order.id}`);
        if (!res.ok) return;
        const data = (await res.json()) as { order: OrderDetail };
        setOrder(data.order);
      } catch {
        // ignore
      }
    }, 8000);
    return () => clearInterval(timer);
  }, [order.id, isActive]);

  async function handleReorder() {
    setReorderBusy(true);
    try {
      await reorderOrder(order.id);
      router.push("/cart");
    } catch (e) {
      alert(e instanceof Error ? e.message : "ხელახალი შეკვეთა ვერ მოხერხდა");
    } finally {
      setReorderBusy(false);
    }
  }

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-4 inline-flex text-sm font-medium text-[#FF0050] hover:underline"
      >
        ← შეკვეთები
      </Link>

      {showSuccess && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          შეკვეთა წარმატებით გაფორმდა!
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">#{order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">
            {new Date(order.createdAt).toLocaleString("ka-GE")}
          </p>
        </div>
        <span className="rounded-full bg-[#FF0050]/10 px-3 py-1 text-sm font-medium text-[#FF0050]">
          {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold">სტატუსი</h2>
            {isActive && order.estimatedTime && (
              <p className="mt-2 text-sm text-neutral-500">
                სავარაუდო მიწოდება: ~{order.estimatedTime} წთ
              </p>
            )}
            <div className="mt-4">
              <OrderTimeline status={order.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold">პროდუქტები</h2>
            <ul className="mt-4 divide-y divide-neutral-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-3 py-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.product.image && (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {item.quantity}× {item.product.name}
                    </p>
                    {item.variant && (
                      <p className="text-sm text-neutral-500">{item.variant.name}</p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="text-xs text-neutral-400">
                        {item.addOns.map((a) => a.addon.name).join(", ")}
                      </p>
                    )}
                    {(item.customizations?.length ?? 0) > 0 && (
                      <p className="text-xs text-neutral-400">
                        {(item.customizations ?? [])
                          .map((c) => `${c.groupName}: ${c.optionName}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold">{formatGel(item.total)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold">რესტორანი</h2>
            <p className="mt-2">{order.restaurant.name}</p>
            <a
              href={`tel:${order.restaurant.phone}`}
              className="mt-1 flex items-center gap-1 text-sm text-neutral-500 hover:text-[#FF0050]"
            >
              <Phone className="size-4" />
              {order.restaurant.phone}
            </a>
          </section>

          {isActive && order.courier && (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-bold">კურიერი</h2>
              <p className="mt-2 text-sm">
                {order.courier.firstName} {order.courier.lastName}
              </p>
              <a
                href={`tel:${order.courier.phone}`}
                className="mt-1 flex items-center gap-1 text-sm text-[#FF0050] hover:underline"
              >
                <Phone className="size-4" />
                {order.courier.phone}
              </a>
            </section>
          )}

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="font-bold">მისამართი</h2>
            <p className="mt-2 text-sm">
              {order.address.city}, {order.address.street}
              {order.address.building ? `, ${order.address.building}` : ""}
              {order.address.apartment ? `, ბ. ${order.address.apartment}` : ""}
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>ქვეჯამი</dt>
                <dd>{formatGel(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>მიწოდება</dt>
                <dd>{formatGel(order.deliveryFee)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>ფასდაკლება</dt>
                  <dd>−{formatGel(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-bold">
                <dt>სულ</dt>
                <dd>{formatGel(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-neutral-500">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod} ·{" "}
              {order.paymentStatus}
            </p>
          </section>

          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild>
              <Link href={`/account/help?order=${order.orderNumber}`}>
                <Headphones className="size-4" />
                დახმარება
              </Link>
            </Button>
            {order.status === "DELIVERED" && (
              <Button
                className="bg-[#FF0050] hover:bg-[#e00048]"
                disabled={reorderBusy}
                onClick={() => void handleReorder()}
              >
                <RotateCcw className="size-4" />
                ხელახლა შეკვეთა
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
