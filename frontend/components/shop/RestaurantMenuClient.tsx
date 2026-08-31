"use client";

import { useState } from "react";
import RestaurantMenuView from "@/components/RestaurantMenuView";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import type {
  PublicMenuProduct,
  PublicMenuCategory,
  PublicRestaurantDetail,
} from "@/lib/restaurants";

type RestaurantMenuClientProps = {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  addOns?: unknown;
};

export default function RestaurantMenuClient({
  restaurant,
  menu,
}: RestaurantMenuClientProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<PublicMenuProduct | null>(null);
  const [initialVariantId, setInitialVariantId] = useState<string | null>(null);
  const [initialQuantity, setInitialQuantity] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openProduct(
    product: PublicMenuProduct,
    variantId?: string,
    quantity?: number,
  ) {
    setSelectedProduct(product);
    setInitialVariantId(variantId ?? null);
    setInitialQuantity(quantity ?? 1);
    setSheetOpen(true);
  }

  return (
    <>
      <RestaurantMenuView
        restaurant={restaurant}
        menu={menu}
        onProductClick={openProduct}
      />
      <ProductDetailSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantOpen={restaurant.isOpen}
        initialVariantId={initialVariantId}
        initialQuantity={initialQuantity}
      />
    </>
  );
}
