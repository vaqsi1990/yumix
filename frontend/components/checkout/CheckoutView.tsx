"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGel } from "@/lib/admin/format";
import type { CartViewData } from "@/components/CartView";
import {
  createAddress,
  createOrder,
  fetchCartQuote,
  type Address,
} from "@/lib/shop-api";
import dynamic from "next/dynamic";

const LocationMapPicker = dynamic(
  () => import("@/components/maps/LocationMapPicker"),
  { ssr: false },
);

type Totals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
};

export default function CheckoutView({
  cart,
  totals: initialTotals,
  addresses: initialAddresses,
}: {
  cart: CartViewData;
  totals: Totals;
  addresses: Address[];
}) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [addressId, setAddressId] = useState(
    initialAddresses.find((a) => a.isDefault)?.id ??
      initialAddresses[0]?.id ??
      "",
  );
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
  const [customerNote, setCustomerNote] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(
    initialAddresses.length === 0,
  );
  const [newAddress, setNewAddress] = useState({
    title: "სახლი",
    city: "თბილისი",
    street: "",
    building: "",
    apartment: "",
    deliveryNote: "",
    latitude: "",
    longitude: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState(initialTotals);
  const [outOfRange, setOutOfRange] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const belowMinimum =
    cart.restaurant.minimumOrder != null &&
    totals.subtotal < cart.restaurant.minimumOrder;

  useEffect(() => {
    if (!addressId) return;
    let cancelled = false;
    void fetchCartQuote(addressId)
      .then((data) => {
        if (cancelled) return;
        if (data.totals) setTotals(data.totals);
        setOutOfRange(Boolean(data.delivery?.outOfRange));
        setDistanceKm(data.delivery?.distanceKm ?? null);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "მიწოდების გაანგარიშება ვერ მოხერხდა");
      });
    return () => {
      cancelled = true;
    };
  }, [addressId]);

  function mapCoords() {
    const latitude = Number(newAddress.latitude);
    const longitude = Number(newAddress.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }
    return { latitude, longitude };
  }

  async function saveNewAddress(isDefault: boolean) {
    const coords = mapCoords();
    if (!newAddress.street.trim() || !coords) {
      throw new Error("აირჩიე მისამართი რუკაზე");
    }
    return createAddress({
      title: newAddress.title,
      city: newAddress.city,
      street: newAddress.street,
      building: newAddress.building || null,
      apartment: newAddress.apartment || null,
      entrance: null,
      floor: null,
      postalCode: null,
      latitude: coords.latitude,
      longitude: coords.longitude,
      deliveryNote: newAddress.deliveryNote || null,
      isDefault,
    });
  }

  async function handleCreateAddress() {
    setBusy(true);
    setError("");
    try {
      const { address } = await saveNewAddress(addresses.length === 0);
      setAddresses((prev) => [...prev, address]);
      setAddressId(address.id);
      setShowNewAddress(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "მისამართის შექმნა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (belowMinimum || outOfRange) return;
    if (!addressId && !showNewAddress) {
      setError("აირჩიე მიწოდების მისამართი");
      return;
    }

    setBusy(true);
    setError("");
    try {
      let finalAddressId = addressId;
      if (showNewAddress || !finalAddressId) {
        const { address } = await saveNewAddress(true);
        finalAddressId = address.id;
      }

      const { order } = await createOrder({
        addressId: finalAddressId,
        paymentMethod,
        customerNote: customerNote.trim() || null,
      });
      router.push(`/account/orders/${order.id}?success=1`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "შეკვეთის გაფორმება ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">მიწოდების მისამართი</h2>
          {addresses.length > 0 && !showNewAddress && (
            <div className="mt-4 space-y-2">
              <Label>აირჩიე მისამართი</Label>
              <Select value={addressId} onValueChange={setAddressId}>
                <SelectTrigger>
                  <SelectValue placeholder="მისამართი" />
                </SelectTrigger>
                <SelectContent>
                  {addresses.map((address) => (
                    <SelectItem key={address.id} value={address.id}>
                      {address.title} — {address.city}, {address.street}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                className="text-sm text-[#FF0050] hover:underline"
                onClick={() => setShowNewAddress(true)}
              >
                + ახალი მისამართი
              </button>
            </div>
          )}

          {(showNewAddress || addresses.length === 0) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <Label>სათაური</Label>
                <Input
                  value={newAddress.title}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, title: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>ქალაქი</Label>
                <Input
                  value={newAddress.city}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, city: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>ქუჩა *</Label>
                <Input
                  value={newAddress.street}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, street: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>სახლი</Label>
                <Input
                  value={newAddress.building}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, building: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>ბინა</Label>
                <Input
                  value={newAddress.apartment}
                  onChange={(e) =>
                    setNewAddress((a) => ({ ...a, apartment: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>აირჩიე რუკაზე *</Label>
                <LocationMapPicker
                  city={newAddress.city}
                  latitude={newAddress.latitude}
                  longitude={newAddress.longitude}
                  addressQuery={[newAddress.street, newAddress.city]
                    .filter(Boolean)
                    .join(", ")}
                  onChange={(lat, lng) =>
                    setNewAddress((a) => ({
                      ...a,
                      latitude: lat,
                      longitude: lng,
                    }))
                  }
                  onAddressResolved={(address) =>
                    setNewAddress((a) => ({
                      ...a,
                      street: address.street || a.street,
                      city: address.city || a.city,
                    }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label>მიწოდების ინსტრუქცია</Label>
                <Textarea
                  rows={2}
                  value={newAddress.deliveryNote}
                  onChange={(e) =>
                    setNewAddress((a) => ({
                      ...a,
                      deliveryNote: e.target.value,
                    }))
                  }
                />
              </div>
              {addresses.length > 0 && (
                <button
                  type="button"
                  className="text-sm text-neutral-500 hover:underline sm:col-span-2"
                  onClick={() => setShowNewAddress(false)}
                >
                  არსებული მისამართის გამოყენება
                </button>
              )}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">გადახდის მეთოდი</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["CASH", "ნაღდი"],
                ["CARD", "ბარათი"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                  paymentMethod === value
                    ? "border-[#FF0050] bg-[#FF0050]/10 text-[#FF0050]"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-bold">შენიშვნა</h2>
          <Textarea
            className="mt-3"
            rows={3}
            placeholder="მაგ: ზარის გარეშე დატოვე ქვედა კარებთან"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
          />
        </section>
      </div>

      <aside className="h-fit rounded-2xl border border-neutral-200 bg-[#F5F5F5] p-5 lg:sticky lg:top-4">
        <h2 className="text-lg font-bold">შეკვეთის შეჯამება</h2>
        <p className="mt-1 text-sm text-neutral-500">{cart.restaurant.name}</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>ქვეჯამი</dt>
            <dd>{formatGel(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>
              მიწოდება
              {distanceKm != null ? (
                <span className="ml-1 font-normal text-neutral-500">
                  ({distanceKm.toFixed(1)} კმ)
                </span>
              ) : null}
            </dt>
            <dd>
              {totals.deliveryFee === 0
                ? "უფასო"
                : formatGel(totals.deliveryFee)}
            </dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>ფასდაკლება</dt>
              <dd>−{formatGel(totals.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold">
            <dt>სულ</dt>
            <dd>{formatGel(totals.total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-neutral-500">
          სავარაუდო მიწოდება: 35-55 წთ
        </p>
        {belowMinimum && (
          <p className="mt-3 text-sm text-[#FF0050]">
            მინიმალური შეკვეთა: {formatGel(cart.restaurant.minimumOrder ?? 0)}
          </p>
        )}
        {outOfRange && (
          <p className="mt-3 text-sm text-[#FF0050]">
            ეს მისამართი მიწოდების რადიუსს სცდება
          </p>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <Button
          type="button"
          className="mt-5 w-full bg-[#FF0050] hover:bg-[#e00048]"
          disabled={busy || belowMinimum || outOfRange}
          onClick={() => void handleSubmit()}
        >
          {busy ? "იგზავნება..." : "შეკვეთის გაფორმება"}
        </Button>
        <Link
          href="/cart"
          className="mt-3 block text-center text-sm text-neutral-500 hover:text-[#FF0050]"
        >
          ← კალათაში დაბრუნება
        </Link>
      </aside>
    </div>
  );
}
