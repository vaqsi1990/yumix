"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { formatDateTime, formatGel } from "@/lib/admin/format";
import { sortVariantsBySize } from "@/lib/product-sizes";
import type { AdminCategory, AdminProduct, AdminRestaurant } from "./types";
import {
  AVAILABILITY_BADGE,
  AVAILABILITY_LABELS,
} from "./types";
import {
  getCategoryName,
  getRestaurantName,
} from "./helpers";

const ALLERGEN_LABELS: Record<string, string> = {
  gluten: "გლუტენი",
  milk: "რძე",
  eggs: "კვერცხი",
  fish: "თევზი",
  nuts: "კაკალი",
  soy: "სოია",
  vegan: "ვეგანური",
  vegetarian: "ვეგეტარიანული",
};

type ProductViewDrawerProps = {
  product: AdminProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: AdminRestaurant[];
  categories: AdminCategory[];
};

export default function ProductViewDrawer({
  product,
  open,
  onOpenChange,
  restaurants,
  categories,
}: ProductViewDrawerProps) {
  if (!product) return null;

  const activeAllergens = Object.entries(product.allergens)
    .filter(([, v]) => v)
    .map(([k]) => ALLERGEN_LABELS[k] ?? k);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerClose onClick={() => onOpenChange(false)} />
        <DrawerHeader>
          <DrawerTitle>{product.name}</DrawerTitle>
          <DrawerDescription>
            {getRestaurantName(product.restaurantId, restaurants)} ·{" "}
            {getCategoryName(product.categoryId, categories)}
          </DrawerDescription>
        </DrawerHeader>
        <DrawerBody className="space-y-6">
          {product.image && (
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="400px"
                className="object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={AVAILABILITY_BADGE[product.availability]}>
              {AVAILABILITY_LABELS[product.availability]}
            </Badge>
            <span className="text-lg font-bold">{formatGel(product.price)}</span>
            {product.discountPrice != null && (
              <span className="text-[16px] md:text-[18px] text-emerald-600">
                ფასდაკლება: {formatGel(product.discountPrice)}
              </span>
            )}
          </div>

          {product.description && (
            <div>
              <h4 className="mb-1 text-[16px] md:text-[18px] font-medium text-muted-foreground">
                აღწერა
              </h4>
              <p className="text-[16px] md:text-[18px]">{product.description}</p>
            </div>
          )}

          <dl className="grid grid-cols-2 gap-3 text-[16px] md:text-[18px]">
            <div>
              <dt className="text-muted-foreground">მომზადება</dt>
              <dd className="font-medium">
                {product.preparationTime != null
                  ? `${product.preparationTime} წთ`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">კალორია</dt>
              <dd className="font-medium">
                {product.calories != null ? `${product.calories} kcal` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">წონა</dt>
              <dd className="font-medium">
                {product.weight != null ? `${product.weight} გ` : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">შექმნა</dt>
              <dd className="font-medium">{formatDateTime(product.createdAt)}</dd>
            </div>
          </dl>

          {product.variants.length > 0 && (
            <div>
              <h4 className="mb-2 text-[16px] md:text-[18px] font-medium">ზომები</h4>
              <ul className="space-y-1 text-[16px] md:text-[18px]">
                {sortVariantsBySize(product.variants).map((v) => (
                  <li key={v.id} className="flex justify-between">
                    <span>{v.name}</span>
                    <span className="font-medium">{formatGel(v.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {product.addOns.length > 0 && (
            <div>
              <h4 className="mb-2 text-[16px] md:text-[18px] font-medium">დამატებები</h4>
              <ul className="space-y-1 text-[16px] md:text-[18px]">
                {product.addOns.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{a.name}</span>
                    <span className="font-medium">{formatGel(a.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {activeAllergens.length > 0 && (
            <div>
              <h4 className="mb-2 text-[16px] md:text-[18px] font-medium">ალერგენები</h4>
              <div className="flex flex-wrap gap-1.5">
                {activeAllergens.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {product.gallery.length > 0 && (
            <div>
              <h4 className="mb-2 text-[16px] md:text-[18px] font-medium">გალერეა</h4>
              <div className="grid grid-cols-3 gap-2">
                {product.gallery.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square overflow-hidden rounded-lg bg-muted"
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="100px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
