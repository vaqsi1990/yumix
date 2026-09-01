"use client";

import { useEffect, useState } from "react";
import RestaurantMenuView from "@/components/RestaurantMenuView";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { ensureCartRestaurant } from "@/lib/shop-api";
import type {
  PublicMenuProduct,
  PublicMenuCategory,
  PublicRestaurantDetail,
  RestaurantMenuResponse,
} from "@/lib/restaurants";

type RestaurantMenuClientProps = {
  restaurant: PublicRestaurantDetail;
  menu: PublicMenuCategory[];
  addOns?: RestaurantMenuResponse["addOns"];
};

export default function RestaurantMenuClient({
  restaurant,
  menu,
  addOns = [],
}: RestaurantMenuClientProps) {
  const { user, status } = useAuth();
  const { applyCartResponse } = useCart();
  const [selectedProduct, setSelectedProduct] =
    useState<PublicMenuProduct | null>(null);
  const [initialVariantId, setInitialVariantId] = useState<string | null>(null);
  const [initialQuantity, setInitialQuantity] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !user) return;

    void ensureCartRestaurant(restaurant.id).then((cleared) => {
      if (!cleared) return;
      applyCartResponse({ cart: { items: [] }, totals: { itemCount: 0 } });
    });
  }, [restaurant.id, user, status, applyCartResponse]);

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
        restaurantId={restaurant.id}
        restaurantOpen={restaurant.isOpen}
        addOns={addOns}
        initialVariantId={initialVariantId}
        initialQuantity={initialQuantity}
      />
    </>
  );
}
