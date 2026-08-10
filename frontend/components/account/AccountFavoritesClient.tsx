"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, ShoppingBag, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductDetailSheet from "@/components/shop/ProductDetailSheet";
import AccountEmptyState from "@/components/account/AccountEmptyState";
import AccountPageHeader from "@/components/account/AccountPageHeader";
import { formatGel } from "@/lib/admin/format";
import type { PublicMenuProduct } from "@/lib/restaurants";
import {
  removeFavoriteProduct,
  removeFavoriteRestaurant,
  type FavoriteProduct,
  type RestaurantCard,
} from "@/lib/account-api";

function FavoriteRestaurantCard({
  restaurant,
  onRemove,
}: {
  restaurant: RestaurantCard;
  onRemove: (id: string) => void;
}) {
  const image = restaurant.coverImage || restaurant.logo || "/yumix-logo.svg";
  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <Link href={`/restaurants/${restaurant.slug}`} className="block">
        <div className="relative h-32 bg-neutral-100">
          <Image src={image} alt={restaurant.name} fill sizes="300px" className="object-cover" />
        </div>
        <div className="p-4">
          <p className="font-semibold group-hover:text-[#FF0050]">{restaurant.name}</p>
          <p className="mt-1 text-sm text-neutral-500">
            {restaurant.categories} · ★ {restaurant.rating}
          </p>
          <p className="mt-1 text-xs text-neutral-400">{restaurant.deliveryTime}</p>
        </div>
      </Link>
      <div className="border-t border-neutral-100 px-4 py-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-red-500"
          onClick={() => void onRemove(restaurant.id)}
        >
          <Heart className="size-4 fill-current" />
          რჩეულებიდან წაშლა
        </Button>
      </div>
    </article>
  );
}

export default function AccountFavoritesClient({
  restaurants: initialRestaurants,
  products: initialProducts,
}: {
  restaurants: RestaurantCard[];
  products: FavoriteProduct[];
}) {
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [products, setProducts] = useState(initialProducts);
  const [selectedProduct, setSelectedProduct] = useState<FavoriteProduct | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  async function handleRemoveRestaurant(id: string) {
    await removeFavoriteRestaurant(id);
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleRemoveProduct(id: string) {
    await removeFavoriteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  function openProduct(product: FavoriteProduct) {
    setSelectedProduct(product);
    setSheetOpen(true);
  }

  const sheetProduct: PublicMenuProduct | null = selectedProduct
    ? {
        id: selectedProduct.id,
        name: selectedProduct.name,
        description: null,
        image: selectedProduct.image,
        price: selectedProduct.price,
        discountPrice: selectedProduct.discountPrice,
        outOfStock: selectedProduct.outOfStock,
        variants: selectedProduct.variants,
        customizationGroups: selectedProduct.customizationGroups ?? [],
      }
    : null;

  return (
    <div>
      <AccountPageHeader
        title="რჩეულები"
        description="შენი საყვარელი რესტორნები და კერძები"
      />

      <Tabs defaultValue="restaurants">
        <TabsList className="mb-6 grid w-full grid-cols-2">
          <TabsTrigger value="restaurants">
            რესტორნები ({restaurants.length})
          </TabsTrigger>
          <TabsTrigger value="products">კერძები ({products.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="restaurants">
          {restaurants.length === 0 ? (
            <AccountEmptyState
              icon={Store}
              title="რჩეული რესტორნები არ გაქვს"
              description="დააჭირე გულის ხატულას რესტორნის გვერდზე"
              action={
                <Button asChild className="bg-[#FF0050] hover:bg-[#e00048]">
                  <Link href="/restaurants">რესტორნების ნახვა</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((r) => (
                <FavoriteRestaurantCard
                  key={r.id}
                  restaurant={r}
                  onRemove={handleRemoveRestaurant}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="products">
          {products.length === 0 ? (
            <AccountEmptyState
              icon={ShoppingBag}
              title="რჩეული კერძები არ გაქვს"
              description="რჩეულებში დამატება მალე გამოჩნდება მენიუდან"
              action={
                <Button asChild className="bg-[#FF0050] hover:bg-[#e00048]">
                  <Link href="/restaurants">მენიუს ნახვა</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-neutral-500">{product.restaurant.name}</p>
                    <p className="mt-1 font-bold">
                      {formatGel(product.discountPrice ?? product.price)}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="bg-[#FF0050] hover:bg-[#e00048]"
                        onClick={() => openProduct(product)}
                      >
                        კალათაში
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500"
                        onClick={() => void handleRemoveProduct(product.id)}
                      >
                        წაშლა
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProductDetailSheet
        product={sheetProduct}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        restaurantOpen
      />
    </div>
  );
}
