"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import ProductImageUpload from "@/components/restaurant/products/ProductImageUpload";
import ProductSizeVariantsEditor from "@/components/products/ProductSizeVariantsEditor";
import ProductCustomizationGroupsEditor, {
  normalizeCustomizationGroupsForSubmit,
} from "@/components/products/ProductCustomizationGroupsEditor";
import { normalizeCustomizationGroupKind } from "@/lib/customization-groups";
import type { ProductCustomizationGroup } from "@/components/admin/products/types";
import { onlyStandardMenuCategories } from "@/lib/menu-category-order";
import { KA, PRODUCT_AVAILABILITY_LABELS } from "@/lib/restaurant/labels";
import {
  normalizeProductVariants,
  type ProductSizeVariant,
} from "@/lib/product-sizes";
import {
  isSchemaValid,
  parseWithSchema,
  productDialogSchema,
  restaurantProductWriteSchema,
} from "@/lib/validation/product";
import type {
  ProductAvailability,
  ProductCategory,
  ProductWritePayload,
  RestaurantProduct,
} from "@/lib/restaurant/types";

type ProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: RestaurantProduct | null;
  categories: ProductCategory[];
  defaultCategoryId?: string;
  onSave: (data: ProductWritePayload) => void;
};

const numberInputClass =
  "[appearance:textfield] [-moz-appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

function mapVariantsFromProduct(
  product?: RestaurantProduct | null,
): ProductSizeVariant[] {
  return normalizeProductVariants(product?.variants ?? []);
}

function mapCustomizationGroupsFromProduct(
  product?: RestaurantProduct | null,
): ProductCustomizationGroup[] {
  return (product?.customizationGroups ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    kind: normalizeCustomizationGroupKind(group.kind),
    required: group.required,
    minSelections: group.minSelections,
    maxSelections: group.maxSelections,
    sortOrder: group.sortOrder,
    options: group.options.map((option) => ({
      id: option.id,
      name: option.name,
      price: option.price,
      sortOrder: option.sortOrder,
      isAvailable: option.isAvailable,
    })),
  }));
}

function sanitizeCustomizationGroupsForSubmit(
  groups: ProductCustomizationGroup[],
): ProductCustomizationGroup[] {
  return normalizeCustomizationGroupsForSubmit(groups);
}

function buildFormState(
  product: RestaurantProduct | null | undefined,
  categories: ProductCategory[],
  defaultCategoryId?: string,
) {
  const menuCategories = onlyStandardMenuCategories(categories);
  return {
    name: product?.name ?? "",
    description: product?.description ?? "",
    image: product?.image ?? null,
    categoryId:
      product?.categoryId ?? defaultCategoryId ?? menuCategories[0]?.id ?? "",
    price: product?.price != null ? String(product.price) : "",
    discountPrice: product?.discountPrice?.toString() ?? "",
    preparationTime:
      product?.preparationTime != null ? String(product.preparationTime) : "",
    availability: (product?.availability ?? "AVAILABLE") as ProductAvailability,
    variants: mapVariantsFromProduct(product),
    customizationGroups: mapCustomizationGroupsFromProduct(product),
  };
}

export default function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  onSave,
}: ProductDialogProps) {
  const menuCategories = onlyStandardMenuCategories(categories);
  const initial = buildFormState(product, categories, defaultCategoryId);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [image, setImage] = useState<string | null>(initial.image);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [price, setPrice] = useState(initial.price);
  const [discountPrice, setDiscountPrice] = useState(initial.discountPrice);
  const [preparationTime, setPreparationTime] = useState(initial.preparationTime);
  const [availability, setAvailability] = useState<ProductAvailability>(
    initial.availability,
  );
  const [variants, setVariants] = useState<ProductSizeVariant[]>(
    initial.variants,
  );
  const [customizationGroups, setCustomizationGroups] = useState<
    ProductCustomizationGroup[]
  >(initial.customizationGroups);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
    image?: string;
  }>({});

  useEffect(() => {
    if (!open) return;
    const next = buildFormState(product, categories, defaultCategoryId);
    setName(next.name);
    setDescription(next.description);
    setImage(next.image);
    setUploadError(null);
    setFormError(null);
    setFieldErrors({});
    setCategoryId(next.categoryId);
    setPrice(next.price);
    setDiscountPrice(next.discountPrice);
    setPreparationTime(next.preparationTime);
    setAvailability(next.availability);
    setVariants(next.variants);
    setCustomizationGroups(next.customizationGroups);
  }, [open, product, categories, defaultCategoryId]);

  function handleOpenChange(next: boolean) {
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const parsedPrep = preparationTime.trim()
      ? Number(preparationTime)
      : null;

    const validation = parseWithSchema(productDialogSchema, {
      categoryId,
      name,
      image: image ?? "",
      price,
      description: description || null,
      discountPrice: discountPrice ? Number(discountPrice) : null,
      preparationTime: parsedPrep,
      availability,
    });

    if (!validation.success) {
      setFieldErrors(validation.errors);
      setFormError(validation.message);
      return;
    }

    const payload = {
      name: validation.data.name,
      description: validation.data.description ?? null,
      image: validation.data.image,
      categoryId: validation.data.categoryId,
      price: validation.data.price,
      discountPrice: validation.data.discountPrice ?? null,
      preparationTime: validation.data.preparationTime ?? null,
      availability: validation.data.availability,
      variants: normalizeProductVariants(variants),
      customizationGroups: sanitizeCustomizationGroupsForSubmit(
        customizationGroups,
      ),
    };

    const writeValidation = parseWithSchema(restaurantProductWriteSchema, payload);
    if (!writeValidation.success) {
      setFormError(writeValidation.message);
      return;
    }

    onSave(writeValidation.data);
    onOpenChange(false);
  }

  const canSubmit = isSchemaValid(productDialogSchema, {
    categoryId,
    name,
    image: image ?? "",
    price,
    description: description || null,
    discountPrice: discountPrice ? Number(discountPrice) : null,
    preparationTime: preparationTime.trim() ? Number(preparationTime) : null,
    availability,
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? KA.products.edit : KA.products.create}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <ProductImageUpload
                label={`${KA.image} *`}
                value={image}
                onChange={(url) => {
                  setImage(url);
                  if (url) {
                    setFieldErrors((prev) => ({ ...prev, image: undefined }));
                  }
                }}
                onError={setUploadError}
              />
              {(fieldErrors.image || uploadError) && (
                <p className="text-sm text-destructive">
                  {fieldErrors.image ?? uploadError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-name">{KA.products.name} *</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
                required
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && (
                <p className="text-sm text-destructive">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-desc">{KA.products.description}</Label>
              <Textarea
                id="product-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{KA.products.category} *</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={KA.products.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {menuCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{KA.products.availability}</Label>
                <Select
                  value={availability}
                  onValueChange={(v) =>
                    setAvailability(v as ProductAvailability)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.keys(
                        PRODUCT_AVAILABILITY_LABELS,
                      ) as ProductAvailability[]
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {PRODUCT_AVAILABILITY_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="price"
                  className="flex min-h-10 items-end leading-tight"
                >
                  {KA.products.price} *
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    const parsed = Number(e.target.value.replace(",", "."));
                    if (e.target.value.trim() && parsed > 0) {
                      setFieldErrors((prev) => ({ ...prev, price: undefined }));
                    }
                  }}
                  className={numberInputClass}
                  required
                  aria-invalid={Boolean(fieldErrors.price)}
                />
                {fieldErrors.price && (
                  <p className="text-sm text-destructive">{fieldErrors.price}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="discount"
                  className="flex min-h-10 items-end leading-tight"
                >
                  {KA.products.discountPrice}
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  step={0.01}
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder={KA.optional}
                  className={numberInputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="prep"
                  className="flex min-h-10 items-end leading-tight"
                >
                  {KA.products.prepTime}
                </Label>
                <Input
                  id="prep"
                  type="number"
                  min={1}
                  value={preparationTime}
                  onChange={(e) => setPreparationTime(e.target.value)}
                  placeholder={KA.optional}
                  className={numberInputClass}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <Label className="text-sm font-semibold">
                {KA.products.variants}
              </Label>
              <ProductSizeVariantsEditor
                value={variants}
                onChange={setVariants}
                emptyHint={KA.products.variantsEmpty}
                numberInputClass={numberInputClass}
              />
            </div>

            <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-3">
              <div>
                <Label className="text-sm font-semibold">
                  {KA.products.customizationGroups}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  {KA.products.customizationGroupsHint}
                </p>
              </div>
              <ProductCustomizationGroupsEditor
                value={customizationGroups}
                onChange={setCustomizationGroups}
                numberInputClass={numberInputClass}
              />
            </div>
          </div>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {KA.cancel}
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
            >
              {product ? KA.saveChanges : KA.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
