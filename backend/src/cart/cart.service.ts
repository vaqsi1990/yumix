import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getUserCart(userId: string) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            deliveryFee: true,
            minimumOrder: true,
            logo: true,
          },
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
    }[],
    deliveryFee: number | null | undefined,
    discount = 0,
  ) {
    const subtotal = items.reduce((sum, item) => {
      const addOnsTotal = item.addOns.reduce(
        (a, addon) => a + addon.price * addon.quantity,
        0,
      );
      return sum + item.price * item.quantity + addOnsTotal;
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
      itemCount: items.reduce((n, item) => n + item.quantity, 0),
    };
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

  async getCart(userId: string) {
    const cart = await this.getUserCart(userId);
    if (!cart) return { cart: null, totals: null };

    let discount = 0;
    if (cart.coupon) {
      const base = this.calcCartTotals(cart.items, cart.restaurant.deliveryFee);
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

    const totals = this.calcCartTotals(
      cart.items,
      cart.restaurant.deliveryFee,
      discount,
    );
    return { cart, totals };
  }

  async clearCart(userId: string) {
    await this.prisma.cart.deleteMany({ where: { userId } });
    return { cleared: true };
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    if (!quantity || quantity < 1 || quantity > 99) {
      throw new BadRequestException('რაოდენობა არასწორია');
    }

    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId } },
    });
    if (!item) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    const updated = await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
    return { item: updated };
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
    return { deleted: true };
  }

  async applyCoupon(userId: string, codeRaw: string) {
    const code = codeRaw?.trim();
    if (!code) throw new BadRequestException('შეიყვანე კუპონის კოდი');

    const cart = await this.getUserCart(userId);
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('კალათა ცარიელია');
    }

    const totals = this.calcCartTotals(cart.items, cart.restaurant.deliveryFee);
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
}
