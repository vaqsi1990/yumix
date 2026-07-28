"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Lightbulb, Plus, Trash2 } from "lucide-react";
import "@uploadthing/react/styles.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { UploadDropzone } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import type {
  AdminCategory,
  AdminProduct,
  AdminRestaurant,
  ProductFormData,
  ProductVariant,
} from "./types";
import { createEmptyProductForm, productToFormData } from "./types";
import { getCategoriesForRestaurant } from "./helpers";
import {
  FOOD_TYPE_OPTIONS,
  PREP_TIME_OPTIONS,
  SPICINESS_OPTIONS,
} from "./form-options";
import { productFormSchema } from "@/lib/validation/admin";

type ProductFormViewProps = {
  product: AdminProduct | null;
  restaurants: AdminRestaurant[];
  categories: AdminCategory[];
  saving?: boolean;
  onSave: (data: ProductFormData) => Promise<string | null>;
  onCancel: () => void;
};

function newVariant(): ProductVariant {
  return { id: `new_${Date.now()}_${Math.random()}`, name: "", price: 0 };
}

export default function ProductFormView({
  product,
  restaurants,
  categories,
  saving = false,
  onSave,
  onCancel,
}: ProductFormViewProps) {
  const [form, setForm] = useState<ProductFormData>(() =>
    product ? productToFormData(product) : createEmptyProductForm(),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(
      product ? productToFormData(product) : createEmptyProductForm(),
    );
    setError("");
  }, [product]);

  const scopedCategories = getCategoriesForRestaurant(
    form.restaurantId,
    categories,
  );

  function updateField<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const parsed = productFormSchema.safeParse({
      restaurantId: form.restaurantId,
      categoryId: form.categoryId,
      name: form.name,
      price: form.price,
      discountPrice: form.discountPrice,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ვალიდაცია ვერ გაიარა");
      return false;
    }
    setError("");
    return true;
  }

  async function handleSave() {
    if (!validate()) return;
    const apiError = await onSave(form);
    if (apiError) setError(apiError);
  }

  function updateVariant(index: number, patch: Partial<ProductVariant>) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) =>
        i === index ? { ...v, ...patch } : v,
      ),
    }));
  }

  function removeVariant(index: number) {
    setForm((f) => ({
      ...f,
      variants: f.variants.filter((_, i) => i !== index),
    }));
  }

  const prepValue = form.preparationTime?.toString() ?? "";
  const spiceValue = form.spicinessLevel ?? "";

  const allPhotos = [
    ...(form.image ? [form.image] : []),
    ...form.gallery.filter((url) => url !== form.image),
  ];

  function applyPhotos(photos: string[]) {
    const limited = photos.slice(0, 8);
    setForm((f) => ({
      ...f,
      image: limited[0] ?? null,
      gallery: limited.slice(1),
    }));
  }

  function removePhoto(url: string) {
    applyPhotos(allPhotos.filter((p) => p !== url));
  }

  function setMainPhoto(url: string) {
    applyPhotos([url, ...allPhotos.filter((p) => p !== url)]);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              ძირითადი ინფორმაცია
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">პროდუქტის დასახელება</Label>
              <Input
                id="product-name"
                placeholder="მაგ: ხაჭაპური იმერული"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>რესტორანი</Label>
                <Select
                  value={form.restaurantId || undefined}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      restaurantId: v,
                      categoryId: "",
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიე რესტორანი" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurants.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>კატეგორია</Label>
                <Select
                  value={form.categoryId || undefined}
                  onValueChange={(v) => updateField("categoryId", v)}
                  disabled={!form.restaurantId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიე კატეგორია" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">ფასი ₾</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.price || ""}
                  onChange={(e) =>
                    updateField("price", Number(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">ფასდაკლება ₾</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={form.discountPrice ?? ""}
                  onChange={(e) =>
                    updateField(
                      "discountPrice",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">აღწერა</Label>
              <Textarea
                id="description"
                placeholder="აღწერეთ თქვენი პროდუქტი..."
                rows={5}
                value={form.description ?? ""}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              დამატებითი პარამეტრები
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>მომზადების დრო</Label>
                <Select
                  value={prepValue || undefined}
                  onValueChange={(v) =>
                    updateField("preparationTime", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ დრო" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREP_TIME_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ცხარე</Label>
                <Select
                  value={spiceValue || undefined}
                  onValueChange={(v) => updateField("spicinessLevel", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="აირჩიეთ დონე" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPICINESS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-3">
                <Switch
                  checked={form.allergens.vegetarian}
                  onCheckedChange={(checked) =>
                    updateField("allergens", {
                      ...form.allergens,
                      vegetarian: checked === true,
                    })
                  }
                />
                <span className="text-sm font-medium">ვეგეტარიანული</span>
              </label>
              <label className="flex items-center gap-3">
                <Switch
                  checked={form.allergens.vegan}
                  onCheckedChange={(checked) =>
                    updateField("allergens", {
                      ...form.allergens,
                      vegan: checked === true,
                    })
                  }
                />
                <span className="text-sm font-medium">ვეგანური</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-base font-bold">ვარიანტები</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateField("variants", [...form.variants, newVariant()])
              }
            >
              <Plus className="size-4" />
              დამატება
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {form.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                ვარიანტები არ არის (მაგ: S, M, L ზომები)
              </p>
            ) : (
              form.variants.map((variant, index) => (
                <div
                  key={variant.id}
                  className="grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 sm:grid-cols-[1fr_120px_auto]"
                >
                  <Input
                    placeholder="სახელი (მაგ: დიდი)"
                    value={variant.name}
                    onChange={(e) =>
                      updateVariant(index, { name: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="₾"
                    value={variant.price || ""}
                    onChange={(e) =>
                      updateVariant(index, {
                        price: Number(e.target.value) || 0,
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariant(index)}
                    aria-label="წაშლა"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap justify-end gap-3 pb-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-[120px] bg-white"
            onClick={onCancel}
            disabled={saving}
          >
            გაუქმება
          </Button>
          <Button
            type="button"
            className="min-w-[120px]"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? "ინახება..." : "შენახვა"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              პროდუქტის ფოტოები
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              პირველი ფოტო გამოჩნდება სიაში · მაქს. 8 ფოტო
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <UploadDropzone
              endpoint="productPhotos"
              onClientUploadComplete={(res) => {
                const urls = res
                  .map((f) => f.ufsUrl ?? f.url)
                  .filter(Boolean) as string[];
                applyPhotos([...allPhotos, ...urls]);
              }}
              onUploadError={(err) => setError(err.message)}
            />

            {allPhotos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {allPhotos.map((url, index) => (
                  <div
                    key={url}
                    className={cn(
                      "group relative aspect-square overflow-hidden rounded-lg border",
                      index === 0
                        ? "border-primary ring-1 ring-primary/30"
                        : "border-neutral-200",
                    )}
                  >
                    <Image
                      src={url}
                      alt={index === 0 ? "მთავარი ფოტო" : "გალერეა"}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-white">
                        მთავარი
                      </span>
                    )}
                    <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition group-hover:opacity-100">
                      {index !== 0 && (
                        <button
                          type="button"
                          className="rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white"
                          onClick={() => setMainPhoto(url)}
                        >
                          მთავარი
                        </button>
                      )}
                      <button
                        type="button"
                        className="rounded bg-black/60 p-1 text-white"
                        onClick={() => removePhoto(url)}
                        aria-label="წაშლა"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                ფოტო ჯერ არ არის ატვირთული
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              კატეგორიის არჩევა
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {FOOD_TYPE_OPTIONS.map(({ id, label, icon: Icon }) => {
                const active = form.foodType === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updateField("foodType", id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition",
                      active
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50",
                    )}
                  >
                    <Icon className="size-5 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-semibold text-amber-900">ყურადღება</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800/90">
              დარწმუნდით, რომ ინფორმაცია სწორად არის შეყვანილი. არასწორი
              ინფორმაცია შეიძლება გახდეს შეკვეთის გაუქმების მიზეზი.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
