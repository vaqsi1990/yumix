"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import OrderTimeline from "@/components/orders/OrderTimeline";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseApiError } from "@/lib/admin/api";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { ORDER_STATUS_KA } from "@/lib/admin/labels";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/restaurant/labels";
import type { OrderStatus } from "@/lib/types";

type AdminOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedTime: number | null;
  customerNote: string | null;
  createdAt: string;
  restaurant: { id: string; name: string; phone: string };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  courier: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  coupon: { code: string } | null;
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
    product: { name: string };
    variant: { name: string } | null;
    addOns: Array<{ addon: { name: string }; quantity: number; price: number }>;
  }>;
};

type CourierOption = {
  userId: string;
  user: {
    firstName: string;
    lastName: string;
    phone: string;
    isActive: boolean;
  };
  isOnline: boolean;
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "CANCELLED",
];

export default function AdminOrderDetailClient({
  initialOrder,
}: {
  initialOrder: AdminOrderDetail;
}) {
  const [order, setOrder] = useState(initialOrder);
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState(
    order.courier?.id ?? "",
  );
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCouriers() {
      try {
        const res = await fetch("/api/backend/admin/couriers");
        if (!res.ok) return;
        const data = (await res.json()) as { couriers: CourierOption[] };
        setCouriers(data.couriers.filter((c) => c.user.isActive));
      } catch {
        // ignore
      }
    }
    void loadCouriers();
  }, []);

  async function refreshOrder() {
    const res = await fetch(`/api/backend/admin/orders/${order.id}`);
    if (!res.ok) return;
    const data = (await res.json()) as { order: AdminOrderDetail };
    setOrder(data.order);
    setSelectedStatus(data.order.status);
    setSelectedCourierId(data.order.courier?.id ?? "");
  }

  async function assignCourier() {
    if (!selectedCourierId) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(
        `/api/backend/admin/orders/${order.id}/assign-courier`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ courierId: selectedCourierId }),
        },
      );
      if (!res.ok) {
        throw new Error(await parseApiError(res, "კურიერის მინიჭება ვერ მოხერხდა"));
      }
      const data = (await res.json()) as { order: AdminOrderDetail };
      setOrder(data.order);
      setMessage("კურიერი მინიჭებულია");
    } catch (e) {
      setError(e instanceof Error ? e.message : "კურიერის მინიჭება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(status: OrderStatus) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/backend/admin/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "სტატუსის განახლება ვერ მოხერხდა"));
      }
      const data = (await res.json()) as { order: AdminOrderDetail };
      setOrder(data.order);
      setSelectedStatus(data.order.status);
      setMessage(`სტატუსი განახლდა: ${ORDER_STATUS_KA[data.order.status]}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "სტატუსის განახლება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!confirm("დარწმუნებული ხარ, რომ გსურს შეკვეთის გაუქმება?")) return;
    await updateStatus("CANCELLED");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-neutral-500">
            <Link href="/admin/orders" className="hover:text-[#FF0050] hover:underline">
              ← ყველა შეკვეთა
            </Link>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-inter)] text-2xl font-bold text-neutral-900">
            #{order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <span className="inline-flex rounded-lg bg-[#FF0050]/10 px-3 py-1.5 text-sm font-medium text-[#FF0050]">
          {ORDER_STATUS_KA[order.status]}
        </span>
      </div>

      {(message || error) && (
        <div
          className={`rounded-xl px-4 py-3 text-sm ${
            error
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-lg font-bold">სტატუსის ისტორია</h2>
            <div className="mt-4">
              <OrderTimeline status={order.status} />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="text-lg font-bold">პროდუქტები</h2>
            <ul className="mt-4 divide-y divide-neutral-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {item.quantity}× {item.product.name}
                    </p>
                    {item.variant && (
                      <p className="text-neutral-500">{item.variant.name}</p>
                    )}
                    {item.addOns.length > 0 && (
                      <p className="text-neutral-400">
                        {item.addOns
                          .map((a) => `${a.addon.name} (${a.quantity})`)
                          .join(", ")}
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
            <h2 className="font-bold">მომხმარებელი</h2>
            <p className="mt-2 text-sm">
              {order.user.firstName} {order.user.lastName}
            </p>
            <p className="text-sm text-neutral-500">{order.user.phone}</p>
            <p className="text-sm text-neutral-500">{order.user.email}</p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold">რესტორანი</h2>
            <p className="mt-2 text-sm">{order.restaurant.name}</p>
            <p className="text-sm text-neutral-500">{order.restaurant.phone}</p>
            <Link
              href={`/admin/restaurants/${order.restaurant.id}`}
              className="mt-2 inline-block text-sm text-[#FF0050] hover:underline"
            >
              რესტორნის პროფილი →
            </Link>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="font-bold">მისამართი</h2>
            <p className="mt-2 text-sm">
              {order.address.city}, {order.address.street}
              {order.address.building ? `, ${order.address.building}` : ""}
              {order.address.apartment ? `, ბ. ${order.address.apartment}` : ""}
            </p>
            {order.address.deliveryNote && (
              <p className="mt-1 text-sm text-neutral-500">
                {order.address.deliveryNote}
              </p>
            )}
            {order.customerNote && (
              <p className="mt-2 text-sm text-neutral-500">
                შენიშვნა: {order.customerNote}
              </p>
            )}
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
              {order.coupon && (
                <div className="flex justify-between text-neutral-500">
                  <dt>კუპონი</dt>
                  <dd>{order.coupon.code}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                <dt>სულ</dt>
                <dd>{formatGel(order.total)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-neutral-500">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}{" "}
              · {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </p>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
            <h2 className="font-bold">ადმინისტრირება</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium">სტატუსი</label>
              <Select
                value={selectedStatus}
                onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ORDER_STATUS_KA[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                variant="outline"
                disabled={busy || selectedStatus === order.status}
                onClick={() => void updateStatus(selectedStatus)}
              >
                სტატუსის განახლება
              </Button>
            </div>

            <div className="space-y-2 border-t border-neutral-100 pt-3">
              <label className="text-sm font-medium">კურიერი</label>
              {order.courier && (
                <p className="text-sm text-neutral-500">
                  მიმდინარე: {order.courier.firstName} {order.courier.lastName} ·{" "}
                  {order.courier.phone}
                </p>
              )}
              <Select
                value={selectedCourierId || undefined}
                onValueChange={setSelectedCourierId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="აირჩიე კურიერი" />
                </SelectTrigger>
                <SelectContent>
                  {couriers.map((courier) => (
                    <SelectItem key={courier.userId} value={courier.userId}>
                      {courier.user.firstName} {courier.user.lastName}
                      {courier.isOnline ? " · ონლაინ" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                variant="outline"
                disabled={busy || !selectedCourierId}
                onClick={() => void assignCourier()}
              >
                კურიერის მინიჭება
              </Button>
            </div>

            {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
              <Button
                className="w-full"
                variant="destructive"
                disabled={busy}
                onClick={() => void cancelOrder()}
              >
                შეკვეთის გაუქმება
              </Button>
            )}

            <Button
              className="w-full"
              variant="ghost"
              disabled={busy}
              onClick={() => void refreshOrder()}
            >
              განახლება
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
