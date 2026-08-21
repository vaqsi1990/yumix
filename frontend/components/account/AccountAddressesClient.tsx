"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { formatAddressLine } from "@/lib/account/constants";
import {
  createAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress,
} from "@/lib/account-api";
import type { Address } from "@/lib/shop-api";

const LocationMapPicker = dynamic(
  () => import("@/components/maps/LocationMapPicker"),
  { ssr: false },
);

const EMPTY_FORM = {
  title: "სახლი",
  city: "თბილისი",
  street: "",
  building: "",
  entrance: "",
  floor: "",
  apartment: "",
  deliveryNote: "",
  latitude: "",
  longitude: "",
};

export default function AccountAddressesClient({
  initialAddresses,
}: {
  initialAddresses: Address[];
}) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(address: Address) {
    setEditing(address);
    setForm({
      title: address.title,
      city: address.city,
      street: address.street,
      building: address.building ?? "",
      entrance: address.entrance ?? "",
      floor: address.floor ?? "",
      apartment: address.apartment ?? "",
      deliveryNote: address.deliveryNote ?? "",
      latitude: address.latitude != null ? String(address.latitude) : "",
      longitude: address.longitude != null ? String(address.longitude) : "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    if (!form.street.trim() || !form.latitude || !form.longitude) {
      setError("აირჩიე მისამართი რუკაზე");
      return;
    }
    setBusy(true);
    setError("");
    const payload = {
      title: form.title,
      city: form.city,
      street: form.street,
      building: form.building || null,
      entrance: form.entrance || null,
      floor: form.floor || null,
      apartment: form.apartment || null,
      deliveryNote: form.deliveryNote || null,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      isDefault: addresses.length === 0,
    };

    try {
      if (editing) {
        const { address } = await updateAddress(editing.id, payload);
        setAddresses((prev) => prev.map((a) => (a.id === address.id ? address : a)));
      } else {
        const { address } = await createAddress(payload);
        setAddresses((prev) => [...prev, address]);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "შენახვა ვერ მოხერხდა");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("მისამართის წაშლა გინდა?")) return;
    try {
      await deleteAddress(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : "წაშლა ვერ მოხერხდა");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      const { address } = await setDefaultAddress(id);
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === address.id })),
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "ნაგულისხმევად დაყენება ვერ მოხერხდა");
    }
  }

  return (
    <div>
      <AccountPageHeader
        title="მისამართები"
        description="მიწოდების მისამართების მართვა"
        action={
          <Button onClick={openCreate} className="bg-[#FF0050] hover:bg-[#e00048]">
            <Plus className="size-4" />
            ახალი მისამართი
          </Button>
        }
      />

      {addresses.length === 0 ? (
        <AccountEmptyState
          icon={MapPin}
          title="მისამართები არ გაქვს"
          description="დაამატე მისამართი სწრაფი შეკვეთისთვის"
          action={
            <Button onClick={openCreate} className="bg-[#FF0050] hover:bg-[#e00048]">
              მისამართის დამატება
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <article
              key={address.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{address.title}</p>
                    {address.isDefault && (
                      <span className="rounded-full bg-[#FF0050]/10 px-2 py-0.5 text-xs font-medium text-[#FF0050]">
                        ნაგულისხმევი
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {formatAddressLine(address)}
                  </p>
                  {address.deliveryNote && (
                    <p className="mt-1 text-xs text-neutral-400">{address.deliveryNote}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {!address.isDefault && (
                  <Button size="sm" variant="outline" onClick={() => void handleSetDefault(address.id)}>
                    <Star className="size-4" />
                    ნაგულისხმევი
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => openEdit(address)}>
                  <Pencil className="size-4" />
                  რედაქტირება
                </Button>
                {addresses.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => void handleDelete(address.id)}
                >
                  <Trash2 className="size-4" />
                  წაშლა
                </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "მისამართის რედაქტირება" : "ახალი მისამართი"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>სახელი (სახლი / სამუშაო)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>ქალაქი</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
              <div>
                <Label>ქუჩა</Label>
                <Input
                  value={form.street}
                  onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label>სახელი/№</Label>
                <Input
                  value={form.building}
                  onChange={(e) => setForm((f) => ({ ...f, building: e.target.value }))}
                />
              </div>
              <div>
                <Label>სადარბაზო</Label>
                <Input
                  value={form.entrance}
                  onChange={(e) => setForm((f) => ({ ...f, entrance: e.target.value }))}
                />
              </div>
              <div>
                <Label>სართული</Label>
                <Input
                  value={form.floor}
                  onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>ბინა</Label>
              <Input
                value={form.apartment}
                onChange={(e) => setForm((f) => ({ ...f, apartment: e.target.value }))}
              />
            </div>
            <div>
              <Label>მიწოდების ინსტრუქცია</Label>
              <Textarea
                value={form.deliveryNote}
                onChange={(e) => setForm((f) => ({ ...f, deliveryNote: e.target.value }))}
              />
            </div>
            <div>
              <Label>აირჩიე რუკაზე *</Label>
              <LocationMapPicker
                city={form.city}
                latitude={form.latitude}
                longitude={form.longitude}
                addressQuery={[form.street, form.city].filter(Boolean).join(", ")}
                onChange={(lat, lng) =>
                  setForm((f) => ({ ...f, latitude: lat, longitude: lng }))
                }
                onAddressResolved={(address) =>
                  setForm((f) => ({
                    ...f,
                    street: address.street || f.street,
                    city: address.city || f.city,
                  }))
                }
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              className="bg-[#FF0050] hover:bg-[#e00048]"
              disabled={busy}
              onClick={() => void handleSave()}
            >
              {busy ? "ინახება..." : "შენახვა"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
