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
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantOpen={restaurant.isOpen}
      />
    </>
  );
}
