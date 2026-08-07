"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductPhotosUpload from "./ProductPhotosUpload";
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
import { cn } from "@/lib/utils";
import type {
  AdminCategory,
  AdminProduct,
  AdminRestaurant,
  ProductFormData,
} from "./types";
import { createEmptyProductForm, productToFormData } from "./types";
import { getCategoriesForRestaurant } from "./helpers";
import {
  FOOD_TYPE_OPTIONS,
  PREP_TIME_OPTIONS,
  SPICINESS_OPTIONS,
} from "./form-options";
import { productFormSchema } from "@/lib/validation/admin";
import { isSchemaValid, parseWithSchema } from "@/lib/validation/product";
import { normalizeProductVariants } from "@/lib/product-sizes";
import ProductSizeVariantsEditor from "@/components/products/ProductSizeVariantsEditor";

type ProductFormViewProps = {
  product: AdminProduct | null;
  restaurants: AdminRestaurant[];
  categories: AdminCategory[];
  initialRestaurantId?: string;
  initialCategoryId?: string;
  saving?: boolean;
  onSave: (data: ProductFormData) => Promise<string | null>;
  onCancel: () => void;
  onCategoriesChange?: (categories: AdminCategory[]) => void;
};

export default function ProductFormView({
  product,
  restaurants,
  categories,
  initialRestaurantId = "",
  initialCategoryId = "",
  saving = false,
  onSave,
  onCancel,
  onCategoriesChange,
}: ProductFormViewProps) {
  const [form, setForm] = useState<ProductFormData>(() =>
    product
      ? productToFormData(product)
      : createEmptyProductForm(initialRestaurantId, initialCategoryId),
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [localCategories, setLocalCategories] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  useEffect(() => {
    setForm(
      product
        ? productToFormData(product)
        : createEmptyProductForm(initialRestaurantId, initialCategoryId),
    );
    setError("");
    setFieldErrors({});
  }, [product, initialRestaurantId, initialCategoryId]);

  const scopedCategories = getCategoriesForRestaurant(
    form.restaurantId,
    localCategories,
  );

  const selectedRestaurant = restaurants.find((r) => r.id === form.restaurantId);

  useEffect(() => {
    if (
      form.categoryId &&
      form.restaurantId &&
      !scopedCategories.some((c) => c.id === form.categoryId)
    ) {
      setForm((f) => ({ ...f, categoryId: "" }));
    }
  }, [form.restaurantId, form.categoryId, scopedCategories]);

  function updateField<K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key as string]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key as string];
        return next;
      });
    }
  }

  function validate(): boolean {
    const parsed = parseWithSchema(productFormSchema, {
      restaurantId: form.restaurantId,
      categoryId: form.categoryId,
      name: form.name,
      image: form.image ?? "",
      price: form.price,
      discountPrice: form.discountPrice,
    });
    if (!parsed.success) {
      setFieldErrors(parsed.errors);
      setError(parsed.message);
      return false;
    }
    if (scopedCategories.length === 0 && form.restaurantId) {
      const message = "ჯერ შექმენი მენიუს კატეგორია (მაგ: პიცა, სალათები)";
      setFieldErrors({ categoryId: message });
      setError(message);
      return false;
    }
    setFieldErrors({});
    setError("");
    return true;
  }

  async function handleCreateCategory() {
    if (!form.restaurantId || !newCategoryName.trim()) return;
    setCreatingCategory(true);
    setCategoryError("");
    try {
      const res = await fetch("/api/backend/admin/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: form.restaurantId,
          name: newCategoryName.trim(),
          sortOrder: scopedCategories.length,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string; error?: string };
        setCategoryError(data.message ?? data.error ?? "კატეგორიის შექმნა ვერ მოხერხდა");
        return;
      }
      const data = (await res.json()) as {
        category: AdminCategory;
      };
      const nextCategories = [...localCategories, data.category];
      setLocalCategories(nextCategories);
      onCategoriesChange?.(nextCategories);
      updateField("categoryId", data.category.id);
      setNewCategoryName("");
    } catch {
      setCategoryError("კატეგორიის შექმნა ვერ მოხერხდა");
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSave() {
    if (!validate()) return;
    const apiError = await onSave({
      ...form,
      variants: normalizeProductVariants(form.variants),
    });
    if (apiError) setError(apiError);
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

  const canSave =
    isSchemaValid(productFormSchema, {
      restaurantId: form.restaurantId,
      categoryId: form.categoryId,
      name: form.name,
      image: form.image ?? "",
      price: form.price,
      discountPrice: form.discountPrice,
    }) &&
    !(scopedCategories.length === 0 && form.restaurantId);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        {selectedRestaurant?.isApproved === false && (
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
            <div>
              <p className="text-[16px] md:text-[18px] font-semibold text-amber-900">
                რესტორანი ჯერ არ არის დამტკიცებული
              </p>
              <p className="mt-1 text-[16px] md:text-[18px] leading-relaxed text-amber-800/90">
                პროდუქტებს დაამატებ, მაგრამ მომხმარებლებს მაღაზიაში არ გამოჩნდება,
                სანამ რესტორანს არ დაამტკიცებ.{" "}
                <Link
                  href="/admin/restaurants"
                  className="font-medium underline"
                >
                  რესტორნების სია →
                </Link>
              </p>
            </div>
          </div>
        )}

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              ძირითადი ინფორმაცია
            </CardTitle>
            <p className="text-[14px] text-muted-foreground md:text-[16px]">
              * სავალდებულო ველები: სახელი, ფასი, ფოტო
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">პროდუქტის დასახელება *</Label>
              <Input
                id="product-name"
                placeholder="მაგ: ხაჭაპური იმერული"
                value={form.name}
                className={cn(fieldErrors.name && "border-destructive")}
                onChange={(e) => updateField("name", e.target.value)}
              />
              {fieldErrors.name && (
                <p className="text-[16px] md:text-[18px] text-destructive">{fieldErrors.name}</p>
              )}
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
                  <SelectTrigger
                    className={cn(fieldErrors.categoryId && "border-destructive")}
                  >
                    <SelectValue
                      placeholder={
                        form.restaurantId
                          ? scopedCategories.length === 0
                            ? "კატეგორიები არ არის — შექმენი ქვემოთ"
                            : "აირჩიე კატეგორია"
                          : "ჯერ აირჩიე რესტორანი"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {scopedCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.categoryId && (
                  <p className="text-[16px] md:text-[18px] text-destructive">
                    {fieldErrors.categoryId}
                  </p>
                )}
                {form.restaurantId && (
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="ახალი მენიუს კატეგორია, მაგ: პიცა"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCreateCategory();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={creatingCategory || !newCategoryName.trim()}
                      onClick={() => void handleCreateCategory()}
                    >
                      {creatingCategory ? "..." : "დამატება"}
                    </Button>
                  </div>
                )}
                {categoryError && (
                  <p className="text-[16px] md:text-[18px] text-destructive">{categoryError}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">ფასი ₾ *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0.01}
                  step="0.01"
                  placeholder="მაგ: 12.50"
                  value={form.price > 0 ? form.price : ""}
                  className={cn(fieldErrors.price && "border-destructive")}
                  onChange={(e) => {
                    const raw = e.target.value;
                    updateField("price", raw === "" ? 0 : Number(raw));
                  }}
                />
                {fieldErrors.price ? (
                  <p className="text-[16px] md:text-[18px] text-destructive">{fieldErrors.price}</p>
                ) : (
                  <p className="text-[16px] md:text-[18px] text-muted-foreground">
                    ფასი უნდა იყოს 0-ზე მეტი
                  </p>
                )}
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
                <span className="text-[16px] md:text-[18px] font-medium">ვეგეტარიანული</span>
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
                <span className="text-[16px] md:text-[18px] font-medium">ვეგანური</span>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              ზომები (არასავალდებულო)
            </CardTitle>
            <p className="text-[14px] text-muted-foreground md:text-[16px]">
              S, M, L, XL, XXL — შეიყვანეთ ფასი მხოლოდ იმ ზომებისთვის, რომლებიც
              გსურთ. ცარიელი დატოვება შეიძლება.
            </p>
          </CardHeader>
          <CardContent>
            <ProductSizeVariantsEditor
              value={form.variants}
              onChange={(variants) => updateField("variants", variants)}
              emptyHint="ზომები არ არის მითითებული — სურვილისამებრ შეიყვანეთ ფასი"
            />
          </CardContent>
        </Card>

        {error && <p className="text-[16px] md:text-[18px] text-destructive">{error}</p>}

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
            disabled={saving || !canSave}
          >
            {saving ? "ინახება..." : "შენახვა"}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        <Card className="border-neutral-200 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold">
              პროდუქტის ფოტოები *
            </CardTitle>
            <p className="text-[16px] md:text-[18px] text-muted-foreground">
              პირველი ფოტო სავალდებულოა · მაქს. 8 ფოტო
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProductPhotosUpload
              photos={allPhotos}
              onPhotosChange={(photos) => {
                applyPhotos(photos);
                if (photos.length > 0) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.image;
                    return next;
                  });
                }
              }}
              onError={(msg) => setError(msg)}
            />
            {fieldErrors.image && (
              <p className="text-[16px] text-destructive md:text-[18px]">
                {fieldErrors.image}
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
            <p className="text-[16px] md:text-[18px] font-semibold text-amber-900">ყურადღება</p>
            <p className="mt-1 text-[16px] md:text-[18px] leading-relaxed text-amber-800/90">
              დარწმუნდით, რომ ინფორმაცია სწორად არის შეყვანილი. არასწორი
              ინფორმაცია შეიძლება გახდეს შეკვეთის გაუქმების მიზეზი.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
