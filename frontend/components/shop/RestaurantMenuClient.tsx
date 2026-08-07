"use client";

import { useState } from "react";
import RestaurantMenuView from "@/components/RestaurantMenuView";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import type {
  PublicMenuProduct,
  PublicMenuCategory,
  PublicRestaurantDetail,
} from "@/lib/restaurants";
import type { PublicAddOn } from "@/lib/shop-api";

type RestaurantMenuClientProps = {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  addOns: PublicAddOn[];
};

export default function RestaurantMenuClient({
  restaurant,
  menu,
  addOns,
}: RestaurantMenuClientProps) {
  const [selectedProduct, setSelectedProduct] =
    useState<PublicMenuProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function openProduct(product: PublicMenuProduct) {
    setSelectedProduct(product);
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
        addOns={addOns}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantOpen={restaurant.isOpen}
      />
    </>
  );
}
