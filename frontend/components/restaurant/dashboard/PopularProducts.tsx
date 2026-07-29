"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/restaurant/format";
import { KA } from "@/lib/restaurant/labels";
import type { PopularProduct } from "@/lib/restaurant/types";

type PopularProductsProps = {
  products: PopularProduct[];
};

export default function PopularProducts({ products }: PopularProductsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          {KA.dashboard.popularProducts}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">{KA.noDataYet}</p>
        ) : (
          products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                {index + 1}
              </span>
              {product.image ? (
                <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.image}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="size-10 shrink-0 rounded-lg bg-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.categoryName} · {product.orderCount} შეკვეთა
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">
                  {formatCurrency(product.discountPrice ?? product.price)}
                </p>
                {product.discountPrice != null && (
                  <Badge variant="secondary" className="mt-0.5 text-[10px]">
                    {KA.sale}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
