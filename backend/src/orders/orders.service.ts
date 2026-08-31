import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertMinimumOrder,
  assertProductOrderable,
  assertRestaurantOrderable,
  estimateDeliveryMinutes,
  generateOrderNumber,
  orderInclude,
} from '../common/order.utils';
import { ADDON_CARRIER_PRODUCT_NAME } from '../common/addon-categories';
import { quoteDeliveryFee } from '../common/delivery.utils';
import type { CreateOrderDto } from './dto/order.schemas';
import type { PaymentMethod, PaymentStatus } from '../generated/prisma/client';
import { AddressesService } from './addresses.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private addresses: AddressesService,
  ) {}

  private mapOrder(order: Awaited<ReturnType<typeof this.fetchOrder>>) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      total: order.total,
      estimatedTime: order.estimatedTime,
      customerNote: order.customerNote,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      restaurant: order.restaurant,
      address: order.address,
      courier: order.courier,
      coupon: order.coupon,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        product: item.product,
        variant: item.variant,
        addOns: item.addOns.map((a) => ({
          id: a.id,
          quantity: a.quantity,
          price: a.price,
          addon: a.addon,
        })),
        customizations: item.customizations.map((c) => ({
          id: c.id,
          quantity: c.quantity,
          price: c.price,
          groupName: c.groupName,
          optionName: c.optionName,
        })),
      })),
      payment: order.payment
        ? {
            id: order.payment.id,
            provider: order.payment.provider,
            status: order.payment.status,
            amount: order.payment.amount,
            currency: order.payment.currency,
            paidAt: order.payment.paidAt?.toISOString() ?? null,
          }
        : null,
    };
  }

  private async fetchOrder(id: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: userId ? { id, userId } : { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    return order;
  }

  async listForUser(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        restaurant: { select: { id: true, name: true, slug: true, logo: true } },
        items: {
          take: 3,
          include: {
            product: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return {
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        estimatedTime: o.estimatedTime,
        total: o.total,
        createdAt: o.createdAt.toISOString(),
        restaurant: o.restaurant,
        itemCount: o.items.length,
        previewItems: o.items,
      })),
    };
  }

  async reorder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { addOns: true, customizations: true } },
      },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    for (const item of order.items) {
      await this.cartService.addItem(userId, {
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        addOns: item.addOns.map((a) => ({
          addonId: a.addonId,
          quantity: a.quantity,
        })),
        customizations: item.customizations.map((c) => ({
          optionId: c.optionId,
          quantity: c.quantity,
        })),
      });
    }

    return this.cartService.getCart(userId);
  }

  async getForUser(userId: string, orderId: string) {
    const order = await this.fetchOrder(orderId, userId);
    return { order: this.mapOrder(order) };
  }

  async createFromCart(userId: string, input: CreateOrderDto) {
    const cartPayload = await this.cartService.getCart(userId);
    const cart = cartPayload.cart;
    const totals = cartPayload.totals;

    if (!cart || !totals || cart.items.length === 0) {
      throw new BadRequestException('კალათა ცარიელია');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: cart.restaurantId },
    });
    if (!restaurant) throw new NotFoundException('რესტორანი ვერ მოიძებნა');

    assertRestaurantOrderable(restaurant);
    assertMinimumOrder(totals.subtotal, restaurant.minimumOrder);

    for (const item of cart.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new BadRequestException('პროდუქტი აღარ არსებობს');
      }
      if (product.name === ADDON_CARRIER_PRODUCT_NAME) {
        continue;
      }
      assertProductOrderable(product, item.product.name);
    }

    const address = await this.addresses.getOwned(userId, input.addressId);

    const delivery = quoteDeliveryFee(restaurant, address);
    if (delivery.outOfRange) {
      const maxKm = restaurant.deliveryRadius;
      throw new BadRequestException(
        maxKm != null
          ? `მიწოდება ამ მისამართზე არ ხდება (${maxKm} კმ რადიუსი)`
          : 'მიწოდება ამ მისამართზე არ ხდება',
      );
    }

    const deliveryFee = delivery.fee;

    let discount = totals.discount;
    let couponId: string | null = cart.couponId;

    if (cart.coupon) {
      const valid =
        cart.coupon.isActive &&
        !this.cartService.isCouponExpired(cart.coupon.expiresAt) &&
        cart.coupon.remainingBalance > 0 &&
        (!cart.coupon.assignedToId || cart.coupon.assignedToId === userId) &&
        (cart.coupon.minimumOrder == null ||
          totals.subtotal + deliveryFee >= cart.coupon.minimumOrder);
      if (!valid) {
        throw new BadRequestException('კუპონი აღარ არის ვალიდური');
      }
      discount = this.cartService.calcCouponDiscount(
        cart.coupon.remainingBalance,
        totals.subtotal + deliveryFee,
      );
    }

    const subtotal = totals.subtotal;
    const total = Math.max(0, subtotal + deliveryFee - discount);
    const estimatedTime = estimateDeliveryMinutes(
      cart.items.map((item) => ({
        product: { preparationTime: null },
      })),
    );

    const paymentStatus = this.resolveInitialPaymentStatus(input.paymentMethod);

    const order = await this.prisma.$transaction(async (tx) => {
      if (couponId && discount > 0) {
        const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
        if (!coupon || coupon.remainingBalance < discount) {
          throw new BadRequestException('კუპონის ბალანსი არასაკმარისია');
        }
        await tx.coupon.update({
          where: { id: couponId },
          data: { remainingBalance: coupon.remainingBalance - discount },
        });
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          restaurantId: cart.restaurantId,
          addressId: address.id,
          subtotal,
          deliveryFee,
          discount,
          total,
          paymentMethod: input.paymentMethod,
          paymentStatus,
          status: 'PENDING',
          estimatedTime,
          customerNote: input.customerNote?.trim() || null,
          couponId,
          items: {
            create: cart.items.map((item) => {
              const addOnTotal = item.addOns.reduce(
                (sum, a) => sum + a.price * a.quantity,
                0,
              );
              const customizationTotal = item.customizations.reduce(
                (sum, c) => sum + c.price * c.quantity,
                0,
              );
              const extrasTotal = addOnTotal + customizationTotal;
              const lineTotal =
                item.price * item.quantity + extrasTotal * item.quantity;
              return {
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                price: item.price,
                total: lineTotal,
                addOns: {
                  create: item.addOns.map((a) => ({
                    addonId: a.addonId,
                    quantity: a.quantity,
                    price: a.price,
                  })),
                },
                customizations: {
                  create: item.customizations.map((c) => ({
                    optionId: c.optionId,
                    groupName: c.option.group.name,
                    optionName: c.option.name,
                    quantity: c.quantity,
                    price: c.price,
                  })),
                },
              };
            }),
          },
          payment: {
            create: {
              provider:
                input.paymentMethod === 'CARD'
                  ? 'card_simulation'
                  : input.paymentMethod.toLowerCase(),
              amount: total,
              currency: 'GEL',
              status: paymentStatus,
              paidAt: paymentStatus === 'PAID' ? new Date() : null,
              transactionId:
                input.paymentMethod === 'CARD'
                  ? `sim_${Date.now()}`
                  : null,
            },
          },
        },
        include: orderInclude,
      });

      if (couponId && discount > 0) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId: created.id,
            amount: discount,
          },
        });
      }

      await tx.cart.delete({ where: { id: cart.id } });

      const owner = await tx.restaurant.findUnique({
        where: { id: cart.restaurantId },
        select: { ownerId: true, name: true },
      });
      if (owner) {
        await tx.notification.create({
          data: {
            userId: owner.ownerId,
            title: 'ახალი შეკვეთა',
            message: `${created.orderNumber} — ${owner.name}`,
            type: 'ORDER_NEW',
          },
        });
      }

      return created;
    });

    return { order: this.mapOrder(order) };
  }

  private resolveInitialPaymentStatus(method: PaymentMethod): PaymentStatus {
    if (method === 'CARD' || method === 'APPLE_PAY' || method === 'GOOGLE_PAY') {
      return 'PAID';
    }
    return 'PENDING';
  }
}
