"use client";

import { useEffect, useState } from "react";
import RestaurantMenuView from "@/components/RestaurantMenuView";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import { useAuth } from "@/components/auth-context";
import { useCart } from "@/components/cart-context";
import { ensureCartRestaurant, CART_REPLACED_NOTICE } from "@/lib/shop-api";
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
  deliveryUnavailableReason?: string;
};

export default function RestaurantMenuClient({
  restaurant,
  menu,
  addOns = [],
  deliveryUnavailableReason,
}: RestaurantMenuClientProps) {
  const { user, status } = useAuth();
  const { applyCartResponse, showNotice } = useCart();
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
      showNotice(CART_REPLACED_NOTICE);
    });
  }, [restaurant.id, user, status, applyCartResponse, showNotice]);

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

  const orderingEnabled =
    restaurant.isOpen && restaurant.deliverable !== false;

  return (
    <>
      <RestaurantMenuView
        restaurant={restaurant}
        menu={menu}
        hasRestaurantAddOns={addOns.length > 0}
        onProductClick={openProduct}
        orderingEnabled={orderingEnabled}
        deliveryUnavailableReason={deliveryUnavailableReason}
      />
      <ProductDetailSheet
        product={selectedProduct}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantId={restaurant.id}
        restaurantOpen={orderingEnabled}
        addOns={addOns}
        initialVariantId={initialVariantId}
        initialQuantity={initialQuantity}
      />
    </>
  );
}
