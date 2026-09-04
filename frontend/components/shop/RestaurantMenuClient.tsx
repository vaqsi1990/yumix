"use client";

import { useState } from "react";
import RestaurantMenuView from "@/components/RestaurantMenuView";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import CartRestaurantConflictBanner from "@/components/shop/CartRestaurantConflictBanner";
import ViewOrderBar, {
  useViewOrderBarVisible,
} from "@/components/shop/ViewOrderBar";
import type {
  PublicMenuProduct,
  PublicMenuCategory,
  PublicRestaurantDetail,
  RestaurantMenuResponse,
} from "@/lib/restaurants";
import { cn } from "@/lib/utils";

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

  const orderingEnabled =
    restaurant.isOpen && restaurant.deliverable !== false;
  const showViewOrderBar =
    useViewOrderBarVisible(restaurant.id) && !sheetOpen;

  return (
    <div
      className={cn(
        showViewOrderBar &&
          "pb-[calc(var(--mobile-nav-height)+var(--safe-area-bottom)+var(--view-order-bar-height)+var(--view-order-bar-gap)+0.5rem)] md:pb-24",
      )}
    >
      <CartRestaurantConflictBanner
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
      />
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
        restaurantName={restaurant.name}
        restaurantOpen={orderingEnabled}
        addOns={addOns}
        initialVariantId={initialVariantId}
        initialQuantity={initialQuantity}
      />
      <ViewOrderBar restaurantId={restaurant.id} hidden={sheetOpen} />
    </div>
  );
}
