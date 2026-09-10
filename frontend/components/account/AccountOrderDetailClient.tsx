"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Headphones, Phone, RotateCcw, XCircle } from "lucide-react";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderLiveTracking from "@/components/orders/OrderLiveTracking";
import StarRating from "@/components/restaurant/StarRating";
import InteractiveStarRating from "@/components/ui/interactive-star-rating";
import type { DeliveryEta } from "@/lib/delivery";
import { ORDER_STATUS_ACTIVE_HINTS } from "@/lib/delivery";
import { Button } from "@/components/ui/button";
import { formatGel } from "@/lib/admin/format";
import {
  ACTIVE_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/account/constants";
import ClientDateTime from "@/components/account/ClientDateTime";
import {
  cancelOrder,
  reorderOrder,
  submitOrderReview,
} from "@/lib/account-api";
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
  eta?: DeliveryEta | null;
  customerNote: string | null;
  scheduledFor?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  hasReview?: boolean;
  review?: {
    rating: number;
    deliveryRating: number | null;
    comment: string | null;
  } | null;
  createdAt: string;
  restaurant: {
    name: string;
    slug: string;
    phone: string;
    logo?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  courier: {
    firstName: string;
    lastName: string;
    phone: string;
    location?: {
      latitude: number | null;
      longitude: number | null;
      updatedAt: string | null;
    } | null;
  } | null;
  address: {
    city: string;
    street: string;
    building: string | null;
    apartment: string | null;
    deliveryNote: string | null;
    latitude?: number | null;
    longitude?: number | null;
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
  const [cancelBusy, setCancelBusy] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [restaurantRating, setRestaurantRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const isActive = ACTIVE_STATUSES.includes(order.status as OrderStatus);
  const canCancel =
    order.status === "PENDING" || order.status === "ACCEPTED";

  async function handleCancel() {
    if (!confirm("დარწმუნებული ხარ, რომ გინდა შეკვეთის გაუქმება?")) return;
    setCancelBusy(true);
    try {
      const { order: next } = await cancelOrder(order.id);
      setOrder(next as OrderDetail);
    } catch (e) {
      alert(e instanceof Error ? e.message : "გაუქმება ვერ მოხერხდა");
    } finally {
      setCancelBusy(false);
    }
  }

  async function handleReview() {
    setReviewBusy(true);
    try {
      const { review } = await submitOrderReview(order.id, {
        rating: restaurantRating,
        deliveryRating: order.courier ? deliveryRating : restaurantRating,
        comment: reviewComment.trim() || null,
      });
      setOrder((prev) => ({
        ...prev,
        hasReview: true,
        review,
      }));
    } catch (e) {
      alert(e instanceof Error ? e.message : "მიმოხილვის გაგზავნა ვერ მოხერხდა");
    } finally {
      setReviewBusy(false);
    }
  }

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
            <ClientDateTime value={order.createdAt} />
            {order.scheduledFor ? (
              <>
                {" · "}
                დაგეგმილი: <ClientDateTime value={order.scheduledFor} />
              </>
            ) : null}
          </p>
        </div>
        <span className="rounded-full bg-[#FF0050]/10 px-3 py-1 text-sm font-medium text-[#FF0050]">
          {ORDER_STATUS_LABELS[order.status as OrderStatus] ?? order.status}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <OrderLiveTracking
            orderId={order.id}
            initialOrder={order}
            poll={isActive}
            showWaitingHint={isActive}
            onOrderUpdate={(next) =>
              setOrder((prev) => ({
                ...prev,
                status: next.status,
                courier: next.courier
                  ? {
                      firstName: next.courier.firstName ?? "",
                      lastName: next.courier.lastName ?? "",
                      phone: next.courier.phone ?? "",
                      location: next.courier.location ?? null,
                    }
                  : prev.courier,
              }))
            }
          />

          <section className="rounded-2xl border border-neutral-200 bg-white p-5">
            <h2 className="font-bold">სტატუსი</h2>
            <p className="mt-1 text-sm text-neutral-500">
              {ORDER_STATUS_ACTIVE_HINTS[order.status] ?? ""}
            </p>
            {isActive && order.eta && (
              <div className="mt-2 text-sm text-neutral-600">
                <p>{order.eta.label}</p>
                <p className="text-neutral-500">მომზადება {order.eta.prepLabel}</p>
                <p className="text-neutral-500">გზაში {order.eta.travelLabel}</p>
              </div>
            )}
            <div className="mt-4">
              <OrderTimeline status={order.status} />
            </div>
          </section>

          {order.status === "CANCELLED" && order.cancellationReason ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
              <p className="font-semibold">გაუქმების მიზეზი</p>
              <p className="mt-1">{order.cancellationReason}</p>
            </section>
          ) : null}

          {order.status === "DELIVERED" && !order.hasReview ? (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h2 className="font-bold">შეფასე შეკვეთა</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {order.courier
                  ? "შეაფასე რესტორანი და კურიერი ვარსკვლავებით."
                  : "შეაფასე რესტორანი ვარსკვლავებით."}
              </p>
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-sm font-medium">რესტორანი / საჭმელი</p>
                  <div className="mt-2">
                    <InteractiveStarRating
                      value={restaurantRating}
                      onChange={setRestaurantRating}
                      ariaLabel="რესტორანის შეფასება"
                      disabled={reviewBusy}
                    />
                  </div>
                </div>
                {order.courier ? (
                  <div>
                    <p className="text-sm font-medium">კურიერი</p>
                    <p className="text-xs text-neutral-500">
                      {order.courier.firstName} {order.courier.lastName}
                    </p>
                    <div className="mt-2">
                      <InteractiveStarRating
                        value={deliveryRating}
                        onChange={setDeliveryRating}
                        ariaLabel="კურიერის შეფასება"
                        disabled={reviewBusy}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
              <textarea
                className="mt-4 w-full rounded-xl border border-neutral-200 p-3 text-sm"
                rows={3}
                placeholder="კომენტარი (არასავალდებულო)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />
              <Button
                className="mt-3 bg-[#FF0050] hover:bg-[#e00048]"
                disabled={reviewBusy}
                onClick={() => void handleReview()}
              >
                მიმოხილვის გაგზავნა
              </Button>
            </section>
          ) : null}

          {order.status === "DELIVERED" && order.hasReview && order.review ? (
            <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <h2 className="font-bold">თქვენი შეფასება</h2>
              <div className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-neutral-600">რესტორანი</span>
                  <StarRating rating={order.review.rating} size="md" />
                  <span className="font-medium">{order.review.rating}/5</span>
                </div>
                {order.courier && order.review.deliveryRating != null ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-neutral-600">კურიერი</span>
                    <StarRating
                      rating={order.review.deliveryRating}
                      size="md"
                    />
                    <span className="font-medium">
                      {order.review.deliveryRating}/5
                    </span>
                  </div>
                ) : null}
                {order.review.comment ? (
                  <p className="text-neutral-600">{order.review.comment}</p>
                ) : null}
              </div>
            </section>
          ) : null}

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
            {canCancel ? (
              <Button
                variant="outline"
                disabled={cancelBusy}
                onClick={() => void handleCancel()}
              >
                <XCircle className="size-4" />
                შეკვეთის გაუქმება
              </Button>
            ) : null}
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
