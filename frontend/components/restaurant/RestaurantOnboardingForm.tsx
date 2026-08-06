"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store } from "lucide-react";
import CategoryMultiSelect from "@/components/admin/restaurants/form/CategoryMultiSelect";
import ImageUploadField from "@/components/admin/restaurants/form/ImageUploadField";
import { slugifyName } from "@/components/admin/restaurants/form-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KA, translateApiError } from "@/lib/restaurant/labels";
import { restaurantApi } from "@/lib/restaurant/api";
import type { ApiUser } from "@/lib/api";
import LocationMapPicker from "@/components/maps/LocationMapPicker";

type RestaurantOnboardingFormProps = {
  owner: ApiUser;
};

const DEFAULT_CITY = "თბილისი";

export default function RestaurantOnboardingForm({
  owner,
}: RestaurantOnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [street, setStreet] = useState("");
  const [phone, setPhone] = useState(owner.phone ?? "");
  const [email, setEmail] = useState(owner.email ?? "");
  const [logo, setLogo] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCategoryError(null);

    const trimmedName = name.trim();
    const trimmedStreet = street.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("რესტორნის სახელი სავალდებულოა");
      return;
    }
    if (categories.length === 0) {
      setCategoryError("აირჩიეთ მინიმუმ ერთი კატეგორია");
      return;
    }
    if (!trimmedStreet) {
      setError("ქუჩა სავალდებულოა");
      return;
    }
    if (trimmedPhone.replace(/\s/g, "").length < 9) {
      setError("ტელეფონი სავალდებულოა");
      return;
    }

    setSubmitting(true);
    try {
      await restaurantApi.createRestaurant({
        name: trimmedName,
        slug: slugifyName(trimmedName),
        description: description.trim(),
        categories,
        city: DEFAULT_CITY,
        street: trimmedStreet,
        phone: trimmedPhone,
        email: email.trim() || undefined,
        logo,
        coverImage,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
      });
      router.refresh();
    } catch (err) {
      setError(
        translateApiError(err instanceof Error ? err.message : KA.failedSave),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4 sm:p-6">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">
                {KA.onboarding.title}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {KA.onboarding.subtitle}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,200px)_1fr] md:items-stretch">
            <ImageUploadField
              label={KA.onboarding.logo}
              aspect="square"
              value={logo}
              onChange={setLogo}
              onError={setError}
              className="mx-auto w-full md:mx-0"
            />
            <ImageUploadField
              label={KA.onboarding.coverImage}
              aspect="wide"
              value={coverImage}
              onChange={setCoverImage}
              onError={setError}
              className="min-h-[180px] w-full sm:min-h-[200px]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">{KA.settings.restaurantName} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="მაგ: ბურგერ ჰაუსი"
                required
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="city">{KA.settings.city}</Label>
              <Input id="city" value={DEFAULT_CITY} disabled readOnly />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">{KA.onboarding.street} *</Label>
              <Input
                id="street"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="მაგ: რუსთაველის გამზ. 10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{KA.settings.phone} *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+995 5XX XX XX XX"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{KA.settings.email}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@restaurant.ge"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{KA.onboarding.categories} *</Label>
              <CategoryMultiSelect
                value={categories}
                onChange={setCategories}
                error={categoryError ?? undefined}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">{KA.settings.generalInfo}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="მოკლე აღწერა..."
                rows={3}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>{KA.settings.mapLocation}</Label>
              <p className="text-sm text-muted-foreground">
                {KA.settings.mapLocationDesc}
              </p>
              <LocationMapPicker
                latitude={latitude}
                longitude={longitude}
                city={DEFAULT_CITY}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/">{KA.backToStore}</Link>
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? KA.onboarding.creating : KA.onboarding.createRestaurant}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
