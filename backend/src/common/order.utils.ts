import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';

type ProductForPricing = {
  price: number;
  discountPrice: number | null;
  isAvailable: boolean;
  isHidden: boolean;
  outOfStock: boolean;
  preparationTime: number | null;
};

type RestaurantForOrder = {
  id: string;
  isOpen: boolean;
  isApproved: boolean;
  minimumOrder: number | null;
  deliveryFee: number | null;
};

export function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `YX-${ts}-${rand}`;
}

export function resolveProductUnitPrice(
  product: ProductForPricing,
  variant?: { id: string; price: number } | null,
) {
  if (variant) return variant.price;
  if (product.discountPrice != null && product.discountPrice > 0) {
    return product.discountPrice;
  }
  return product.price;
}

export function assertProductOrderable(
  product: ProductForPricing,
  label = 'პროდუქტი',
) {
  if (product.isHidden || !product.isAvailable || product.outOfStock) {
    throw new BadRequestException(`${label} ამ moment-ში მიუწვდომელია`);
  }
}

export function assertRestaurantOrderable(restaurant: RestaurantForOrder) {
  if (!restaurant.isApproved) {
    throw new BadRequestException('რესტორანი ჯერ არ არის დამტკიცებული');
  }
  if (!restaurant.isOpen) {
    throw new BadRequestException('რესტორანი დახურულია');
  }
}

export function assertMinimumOrder(
  subtotal: number,
  minimumOrder: number | null | undefined,
) {
  if (minimumOrder != null && subtotal < minimumOrder) {
    throw new BadRequestException(
      `მინიმალური შეკვეთა: ₾${minimumOrder.toFixed(2)}`,
    );
  }
}

export function estimateDeliveryMinutes(
  items: { product: { preparationTime: number | null } }[],
) {
  const maxPrep = items.reduce(
    (max, item) => Math.max(max, item.product.preparationTime ?? 25),
    25,
  );
  return maxPrep + 20;
}

export function addonKey(addonId: string, quantity: number) {
  return `${addonId}:${quantity}`;
}

export function normalizeAddonInputs(
  addOns: { addonId: string; quantity: number }[] | undefined,
) {
  if (!addOns?.length) return [];
  const map = new Map<string, number>();
  for (const row of addOns) {
    const qty = Math.floor(Number(row.quantity));
    if (!row.addonId || qty < 1 || qty > 20) continue;
    map.set(row.addonId, (map.get(row.addonId) ?? 0) + qty);
  }
  return [...map.entries()].map(([addonId, quantity]) => ({
    addonId,
    quantity,
  }));
}

export function cartItemSignature(input: {
  productId: string;
  variantId: string | null;
  addOns: { addonId: string; quantity: number }[];
}) {
  const addons = [...input.addOns]
    .sort((a, b) => a.addonId.localeCompare(b.addonId))
    .map((a) => addonKey(a.addonId, a.quantity))
    .join('|');
  return `${input.productId}:${input.variantId ?? 'base'}:${addons}`;
}

export const orderInclude = {
  restaurant: {
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      phone: true,
      address: true,
      city: true,
    },
  },
  address: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
    },
  },
  courier: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
  coupon: {
    select: { id: true, code: true },
  },
  items: {
    orderBy: { id: 'asc' as const },
    include: {
      product: {
        select: { id: true, name: true, image: true },
      },
      variant: { select: { id: true, name: true, price: true } },
      addOns: {
        include: {
          addon: { select: { id: true, name: true } },
        },
      },
    },
  },
  payment: true,
} satisfies Prisma.OrderInclude;
