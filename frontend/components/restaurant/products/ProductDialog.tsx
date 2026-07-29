"use client";

import { useState } from "react";
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
import { KA, PRODUCT_AVAILABILITY_LABELS } from "@/lib/restaurant/labels";
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

export default function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  onSave,
}: ProductDialogProps) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [image, setImage] = useState<string | null>(product?.image ?? null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(
    product?.categoryId ?? categories[0]?.id ?? "",
  );
  const [price, setPrice] = useState(
    product?.price != null ? String(product.price) : "",
  );
  const [discountPrice, setDiscountPrice] = useState(
    product?.discountPrice?.toString() ?? "",
  );
  const [preparationTime, setPreparationTime] = useState(
    product?.preparationTime != null ? String(product.preparationTime) : "",
  );
  const [availability, setAvailability] = useState<ProductAvailability>(
    product?.availability ?? "AVAILABLE",
  );

  function handleOpenChange(next: boolean) {
    if (next) {
      setName(product?.name ?? "");
      setDescription(product?.description ?? "");
      setImage(product?.image ?? null);
      setUploadError(null);
      setCategoryId(
        product?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
      );
      setPrice(product?.price != null ? String(product.price) : "");
      setDiscountPrice(product?.discountPrice?.toString() ?? "");
      setPreparationTime(
        product?.preparationTime != null
          ? String(product.preparationTime)
          : "",
      );
      setAvailability(product?.availability ?? "AVAILABLE");
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryId) return;

    const parsedPrice = Number(price.replace(",", "."));
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return;
    }

    const parsedPrep = preparationTime.trim()
      ? Number(preparationTime)
      : null;

    onSave({
      name,
      description: description || null,
      image,
      categoryId,
      price: parsedPrice,
      discountPrice: discountPrice ? Number(discountPrice) : null,
      preparationTime: parsedPrep,
      availability,
      variants: product?.variants ?? [],
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {product ? KA.products.edit : KA.products.create}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ProductImageUpload
              label={KA.image}
              value={image}
              onChange={setImage}
              onError={setUploadError}
            />
            {uploadError && (
              <p className="text-sm text-destructive">{uploadError}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="product-name">{KA.products.name}</Label>
              <Input
                id="product-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
                <Label>{KA.products.category}</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder={KA.products.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
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
                  {KA.products.price}
                </Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className={numberInputClass}
                  required
                />
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
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {KA.cancel}
            </Button>
            <Button type="submit" disabled={!categoryId}>
              {product ? KA.saveChanges : KA.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
