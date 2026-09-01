import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AddCartExtraDto, AddCartItemDto } from './dto/cart.schemas';
import {
  assertProductOrderable,
  assertRestaurantOrderable,
  cartItemSignature,
  normalizeAddonInputs,
  resolveProductUnitPrice,
} from '../common/order.utils';
import { quoteDeliveryFee } from '../common/delivery.utils';
import {
  normalizeCustomizationInputs,
  validateProductCustomizations,
} from '../common/customization.utils';
import { ensureAddonCarrierProduct } from '../common/addon-carrier';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  private readonly restaurantSelect = {
    id: true,
    name: true,
    slug: true,
    deliveryFee: true,
    deliveryFeePerKm: true,
    deliveryRadius: true,
    latitude: true,
    longitude: true,
    minimumOrder: true,
    logo: true,
  } as const;

  async getUserCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        restaurant: {
          select: this.restaurantSelect,
        },
        coupon: {
          select: {
            id: true,
            code: true,
            remainingBalance: true,
            expiresAt: true,
            isActive: true,
            assignedToId: true,
            minimumOrder: true,
          },
        },
        items: {
          orderBy: { id: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true,
                discountPrice: true,
                isAvailable: true,
                variants: {
                  select: { id: true, name: true, price: true },
                },
              },
            },
            variant: {
              select: { id: true, name: true, price: true },
            },
            addOns: {
              include: {
                addon: { select: { id: true, name: true } },
              },
            },
            customizations: {
              include: {
                option: {
                  select: {
                    id: true,
                    name: true,
                    group: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  calcCartTotals(
    items: {
      quantity: number;
      price: number;
      addOns: { quantity: number; price: number }[];
      customizations?: { quantity: number; price: number }[];
    }[],
    deliveryFee: number | null | undefined,
    discount = 0,
  ) {
    const subtotal = items.reduce((sum, item) => {
      const addOnsTotal = item.addOns.reduce(
        (a, addon) => a + addon.price * addon.quantity,
        0,
      );
      const customizationTotal = (item.customizations ?? []).reduce(
        (c, row) => c + row.price * row.quantity,
        0,
      );
      return sum + item.price * item.quantity + addOnsTotal + customizationTotal;
    }, 0);

    const fee = deliveryFee ?? 0;
    const beforeDiscount = subtotal + fee;
    const appliedDiscount = Math.min(Math.max(0, discount), beforeDiscount);
    const total = Math.max(0, beforeDiscount - appliedDiscount);

    return {
      subtotal,
      deliveryFee: fee,
      discount: appliedDiscount,
      total,
      itemCount: items.length,
    };
  }

  async getDeliveryDestination(
    userId: string,
    addressId?: string | null,
  ) {
    if (addressId) {
      return this.prisma.address.findFirst({
        where: { id: addressId, userId },
        select: { latitude: true, longitude: true },
      });
    }
    return this.prisma.address.findFirst({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { latitude: true, longitude: true },
    });
  }

  async quoteDelivery(
    userId: string,
    restaurant: Parameters<typeof quoteDeliveryFee>[0],
    addressId?: string | null,
  ) {
    const dest = await this.getDeliveryDestination(userId, addressId);
    return quoteDeliveryFee(restaurant, dest);
  }

  isCouponExpired(expiresAt: Date | null | undefined) {
    if (!expiresAt) return false;
    return expiresAt.getTime() < Date.now();
  }

  calcCouponDiscount(
    remainingBalance: number,
    orderAmountWithDelivery: number,
  ) {
    if (remainingBalance <= 0 || orderAmountWithDelivery <= 0) return 0;
    return Math.min(remainingBalance, orderAmountWithDelivery);
  }

  async getCart(userId: string, addressId?: string | null) {
    const cart = await this.getUserCart(userId);
    if (!cart) return { cart: null, totals: null, delivery: null };

    const addOns = await this.prisma.productAddon.findMany({
      where: { restaurantId: cart.restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
      },
    });

    const delivery = await this.quoteDelivery(
      userId,
      cart.restaurant,
      addressId,
    );

    let discount = 0;
    if (cart.coupon) {
      const base = this.calcCartTotals(cart.items, delivery.fee);
      const c = cart.coupon;
      const valid =
        c.isActive &&
        !this.isCouponExpired(c.expiresAt) &&
        c.remainingBalance > 0 &&
        (!c.assignedToId || c.assignedToId === userId) &&
        (c.minimumOrder == null || base.total >= c.minimumOrder);
      if (valid) {
        discount = this.calcCouponDiscount(c.remainingBalance, base.total);
      }
    }

    const totals = this.calcCartTotals(cart.items, delivery.fee, discount);
    return { cart: { ...cart, addOns }, totals, delivery };
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
    return { cleared: true };
  }

  async updateItem(
    userId: string,
    itemId: string,
    input: { quantity?: number; variantId?: string },
  ) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      include: {
        product: { include: { variants: true } },
        addOns: true,
        customizations: true,
      },
    });
    if (!item) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    const data: { quantity?: number; variantId?: string; price?: number } = {};

    if (input.quantity != null) {
      if (input.quantity < 1 || input.quantity > 99) {
        throw new BadRequestException('რაოდენობა არასწორია');
      }
      data.quantity = input.quantity;
    }

    if (input.variantId && input.variantId !== item.variantId) {
      const variant = item.product.variants.find((row) => row.id === input.variantId);
      if (!variant) {
        throw new BadRequestException('არჩეული ზომა არასწორია');
      }

      const signature = cartItemSignature({
        productId: item.productId,
        variantId: variant.id,
        addOns: item.addOns.map((row) => ({
          addonId: row.addonId,
          quantity: row.quantity,
        })),
        customizations: item.customizations.map((row) => ({
          optionId: row.optionId,
          quantity: row.quantity,
        })),
      });

      const cart = await this.getUserCart(userId);
      const duplicate = cart?.items.find((row) => {
        if (row.id === item.id) return false;
        return (
          cartItemSignature({
            productId: row.productId,
            variantId: row.variantId,
            addOns: row.addOns.map((addon) => ({
              addonId: addon.addonId,
              quantity: addon.quantity,
            })),
            customizations: row.customizations.map((customization) => ({
              optionId: customization.optionId,
              quantity: customization.quantity,
            })),
          }) === signature
        );
      });

      if (duplicate) {
        const nextQty = duplicate.quantity + (data.quantity ?? item.quantity);
        if (nextQty > 99) {
          throw new BadRequestException('მაქსიმუმ რაოდენობა 99');
        }
        await this.prisma.$transaction([
          this.prisma.cartItem.update({
            where: { id: duplicate.id },
            data: { quantity: nextQty },
          }),
          this.prisma.cartItem.delete({ where: { id: item.id } }),
        ]);
        return this.getCart(userId);
      }

      data.variantId = variant.id;
      data.price = resolveProductUnitPrice(item.product, variant);
    }

    if (Object.keys(data).length === 0) {
      return this.getCart(userId);
    }

    await this.prisma.cartItem.update({
      where: { id: itemId },
      data,
    });
    return this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
      select: { id: true, cartId: true },
    });
    if (!item) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    await this.prisma.cartItem.delete({ where: { id: itemId } });
    const remaining = await this.prisma.cartItem.count({
      where: { cartId: item.cartId },
    });
    if (remaining === 0) {
      await this.prisma.cart.delete({ where: { id: item.cartId } });
    }
    return this.getCart(userId);
  }

  async applyCoupon(userId: string, codeRaw: string) {
    const code = codeRaw?.trim();
    if (!code) throw new BadRequestException('შეიყვანე კუპონის კოდი');

    const cart = await this.getUserCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('კალათა ცარიელია');
    }

    const delivery = await this.quoteDelivery(userId, cart.restaurant);
    const totals = this.calcCartTotals(cart.items, delivery.fee);
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('კუპონი არ მოიძებნა ან გათიშულია');
    }
    if (coupon.assignedToId && coupon.assignedToId !== userId) {
      throw new BadRequestException('ეს კუპონი შენზე არ არის მინიჭებული');
    }
    if (this.isCouponExpired(coupon.expiresAt)) {
      throw new BadRequestException('კუპონის ვადა ამოწურულია');
    }
    if (coupon.remainingBalance <= 0) {
      throw new BadRequestException('კუპონის ბალანსი ამოწურულია');
    }
    if (
      coupon.minimumOrder != null &&
      totals.total < coupon.minimumOrder
    ) {
      throw new BadRequestException(
        `მინიმალური თანხა: ₾${coupon.minimumOrder.toFixed(2)}`,
      );
    }

    const discount = this.calcCouponDiscount(
      coupon.remainingBalance,
      totals.total,
    );

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    return {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        remainingBalance: coupon.remainingBalance,
        expiresAt: coupon.expiresAt,
      },
      discount,
      payable: Math.max(0, totals.total - discount),
    };
  }

  async removeCoupon(userId: string) {
    await this.prisma.cart.updateMany({
      where: { userId },
      data: { couponId: null },
    });
    return { removed: true };
  }

  async addItem(userId: string, input: AddCartItemDto) {
    const quantity = input.quantity ?? 1;
    const addOnInputs = normalizeAddonInputs(input.addOns);
    const customizationInputs = normalizeCustomizationInputs(input.customizations);

    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      include: {
        restaurant: true,
        variants: true,
        customizationGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
    });
    if (!product) throw new NotFoundException('პროდუქტი ვერ მოიძებნა');

    assertProductOrderable(product);
    assertRestaurantOrderable(product.restaurant);

    let variant: { id: string; price: number } | null = null;
    if (input.variantId) {
      const found = product.variants.find((v) => v.id === input.variantId);
      if (!found) {
        throw new BadRequestException('არჩეული ზომა არასწორია');
      }
      variant = found;
    } else if (product.variants.length > 0) {
      throw new BadRequestException('აირჩიე ზომა');
    }

    const addons = await this.prisma.productAddon.findMany({
      where: {
        id: { in: addOnInputs.map((a) => a.addonId) },
        restaurantId: product.restaurantId,
      },
    });
    if (addons.length !== addOnInputs.length) {
      throw new BadRequestException('დამატება არასწორია');
    }

    const validatedCustomizations = validateProductCustomizations(
      product.customizationGroups.map((group) => ({
        id: group.id,
        name: group.name,
        required: group.required,
        minSelections: group.minSelections,
        maxSelections: group.maxSelections,
        options: group.options.map((option) => ({
          id: option.id,
          isAvailable: option.isAvailable,
        })),
      })),
      customizationInputs,
    );

    const optionById = new Map(
      product.customizationGroups.flatMap((group) =>
        group.options.map((option) => [option.id, { ...option, group }] as const),
      ),
    );
    if (
      validatedCustomizations.some((row) => !optionById.has(row.optionId))
    ) {
      throw new BadRequestException('არჩევანი არასწორია');
    }

    const addonById = new Map(addons.map((a) => [a.id, a]));
    const unitPrice = resolveProductUnitPrice(product, variant);

    let cart = await this.getUserCart(userId);
    let replacedRestaurant = false;
    if (cart && cart.restaurantId !== product.restaurantId) {
      await this.prisma.cart.deleteMany({ where: { userId } });
      cart = null;
      replacedRestaurant = true;
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          restaurantId: product.restaurantId,
        },
        include: {
          restaurant: {
            select: this.restaurantSelect,
          },
          coupon: true,
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                  price: true,
                  discountPrice: true,
                  isAvailable: true,
                },
              },
              variant: { select: { id: true, name: true, price: true } },
              addOns: {
                include: { addon: { select: { id: true, name: true } } },
              },
              customizations: {
                include: {
                  option: {
                    select: {
                      id: true,
                      name: true,
                      group: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    if (!cart) {
      throw new BadRequestException('კალათის შექმნა ვერ მოხერხდა');
    }

    const signature = cartItemSignature({
      productId: product.id,
      variantId: variant?.id ?? null,
      addOns: addOnInputs,
      customizations: validatedCustomizations,
    });

    const existing = cart.items.find((item) => {
      const itemAddons = item.addOns.map((a) => ({
        addonId: a.addonId,
        quantity: a.quantity,
      }));
      const itemCustomizations = item.customizations.map((c) => ({
        optionId: c.optionId,
        quantity: c.quantity,
      }));
      return (
        cartItemSignature({
          productId: item.productId,
          variantId: item.variantId,
          addOns: itemAddons,
          customizations: itemCustomizations,
        }) === signature
      );
    });

    if (existing) {
      const nextQty = existing.quantity + quantity;
      if (nextQty > 99) {
        throw new BadRequestException('მაქსიმუმ რაოდენობა 99');
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          variantId: variant?.id ?? null,
          quantity,
          price: unitPrice,
          addOns: {
            create: addOnInputs.map((row) => ({
              addonId: row.addonId,
              quantity: row.quantity,
              price: addonById.get(row.addonId)!.price,
            })),
          },
          customizations: {
            create: validatedCustomizations.map((row) => ({
              optionId: row.optionId,
              quantity: row.quantity,
              price: optionById.get(row.optionId)!.price,
            })),
          },
        },
      });
    }

    const result = await this.getCart(userId);
    return replacedRestaurant ? { ...result, replacedRestaurant: true } : result;
  }

  async addExtraItem(userId: string, input: AddCartExtraDto) {
    const quantity = input.quantity ?? 1;
    const addon = await this.prisma.productAddon.findUnique({
      where: { id: input.addonId },
      include: { restaurant: true },
    });
    if (!addon) throw new NotFoundException('დამატება ვერ მოიძებნა');

    assertRestaurantOrderable(addon.restaurant);

    const cart = await this.getUserCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('ჯერ დაამატე მთავარი კერძი კალათაში');
    }
    if (cart.restaurantId !== addon.restaurantId) {
      throw new BadRequestException(
        'კალათაში სხვა რესტორნის პროდუქტებია. ჯერ გაასუფთავე კალათა.',
      );
    }

    const carrier = await ensureAddonCarrierProduct(
      this.prisma,
      addon.restaurantId,
    );
    const addOnInputs = [{ addonId: addon.id, quantity }];

    const signature = cartItemSignature({
      productId: carrier.id,
      variantId: null,
      addOns: addOnInputs,
    });

    const existing = cart.items.find((item) => {
      const itemAddons = item.addOns.map((a) => ({
        addonId: a.addonId,
        quantity: a.quantity,
      }));
      return (
        cartItemSignature({
          productId: item.productId,
          variantId: item.variantId,
          addOns: itemAddons,
        }) === signature
      );
    });

    if (existing) {
      const nextQty = existing.quantity + quantity;
      if (nextQty > 99) {
        throw new BadRequestException('მაქსიმუმ რაოდენობა 99');
      }
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: nextQty },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: carrier.id,
          variantId: null,
          quantity,
          price: 0,
          addOns: {
            create: [
              {
                addonId: addon.id,
                quantity,
                price: addon.price,
              },
            ],
          },
        },
      });
    }

    return this.getCart(userId);
  }
}
