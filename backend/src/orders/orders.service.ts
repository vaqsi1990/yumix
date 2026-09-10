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
  buildOrderEtaSnapshot,
  generateOrderNumber,
  orderInclude,
} from '../common/order.utils';
import { ADDON_CARRIER_PRODUCT_NAME } from '../common/addon-categories';
import { quoteDeliveryFee } from '../common/delivery.utils';
import { etaFromOrderSnapshot } from '../common/eta.utils';
import { CUSTOMER_CANCEL_STATUSES } from '../common/order-status.utils';
import { estimateDrivingDistanceKm } from '../common/routing.utils';
import type { CreateOrderDto } from './dto/order.schemas';
import type { PaymentMethod, PaymentStatus } from '../generated/prisma/client';
import { AddressesService } from './addresses.service';
import { OrderEventsService } from './order-events.service';
import { OrderNotificationsService } from './order-notifications.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private cartService: CartService,
    private addresses: AddressesService,
    private orderEvents: OrderEventsService,
    private orderNotifications: OrderNotificationsService,
  ) {}

  private mapOrder(order: Awaited<ReturnType<typeof this.fetchOrder>>) {
    const eta = etaFromOrderSnapshot(order);
    const courierLocation = order.courier?.courier
      ? {
          latitude: order.courier.courier.currentLatitude,
          longitude: order.courier.courier.currentLongitude,
          updatedAt:
            order.courier.courier.locationUpdatedAt?.toISOString() ?? null,
        }
      : null;

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
      etaPrepMin: order.etaPrepMin,
      etaPrepMax: order.etaPrepMax,
      etaTravelMin: order.etaTravelMin,
      etaTravelMax: order.etaTravelMax,
      etaTotalMin: order.etaTotalMin,
      etaTotalMax: order.etaTotalMax,
      eta,
      customerNote: order.customerNote,
      scheduledFor: order.scheduledFor?.toISOString() ?? null,
      cancelledAt: order.cancelledAt?.toISOString() ?? null,
      cancellationReason: order.cancellationReason,
      hasReview: Boolean(order.review),
      review: order.review
        ? {
            rating: order.review.rating,
            deliveryRating: order.review.deliveryRating,
            comment: order.review.comment,
          }
        : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      restaurant: order.restaurant,
      address: order.address,
      courier: order.courier
        ? {
            id: order.courier.id,
            firstName: order.courier.firstName,
            lastName: order.courier.lastName,
            phone: order.courier.phone,
            location: courierLocation,
          }
        : null,
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
      include: {
        workingHours: { orderBy: { day: 'asc' } },
        deliveryZones: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!restaurant) throw new NotFoundException('რესტორანი ვერ მოიძებნა');

    assertRestaurantOrderable(restaurant);

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
    if (
      address.latitude == null ||
      address.longitude == null ||
      !Number.isFinite(address.latitude) ||
      !Number.isFinite(address.longitude)
    ) {
      throw new BadRequestException(
        'მიწოდების მისამართს სჭირდება სწორი მდებარეობა რუკაზე',
      );
    }

    let distanceKm =
      restaurant.latitude != null &&
      restaurant.longitude != null &&
      address.latitude != null &&
      address.longitude != null
        ? await estimateDrivingDistanceKm(
            {
              latitude: restaurant.latitude,
              longitude: restaurant.longitude,
            },
            { latitude: address.latitude, longitude: address.longitude },
          )
        : null;

    const delivery = quoteDeliveryFee(
      {
        ...restaurant,
        deliveryZones: restaurant.deliveryZones.map((zone) => ({
          maxDistanceKm: zone.maxDistanceKm,
          deliveryFee: zone.deliveryFee,
          minimumOrder: zone.minimumOrder,
          estimatedMinutes: zone.estimatedMinutes,
        })),
      },
      address,
    );
    if (distanceKm != null) {
      delivery.distanceKm = distanceKm;
    }
    if (delivery.outOfRange) {
      const maxKm = restaurant.deliveryRadius;
      throw new BadRequestException(
        maxKm != null
          ? `ამ მისამართზე მიწოდება მიუწვდომელია (მაქს. ${maxKm} კმ)`
          : 'ამ მისამართზე მიწოდება მიუწვდომელია',
      );
    }

    const deliveryFee = delivery.fee;
    const effectiveMinimum =
      delivery.zoneMinimumOrder ?? restaurant.minimumOrder;
    assertMinimumOrder(totals.subtotal, effectiveMinimum);

    let scheduledFor: Date | null = null;
    if (input.scheduledFor) {
      const when = new Date(input.scheduledFor);
      const minLead = Date.now() + 30 * 60 * 1000;
      const maxLead = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (when.getTime() < minLead || when.getTime() > maxLead) {
        throw new BadRequestException(
          'დაგეგმილი შეკვეთა უნდა იყოს 30 წუთიდან 7 დღემდე',
        );
      }
      scheduledFor = when;
    }

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
    const etaSnapshot = buildOrderEtaSnapshot(
      cart.items.map((item) => ({
        product: { preparationTime: item.product.preparationTime ?? null },
      })),
      delivery.distanceKm,
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
          estimatedTime: etaSnapshot.estimatedTime,
          etaPrepMin: etaSnapshot.etaPrepMin,
          etaPrepMax: etaSnapshot.etaPrepMax,
          etaTravelMin: etaSnapshot.etaTravelMin,
          etaTravelMax: etaSnapshot.etaTravelMax,
          etaTotalMin: etaSnapshot.etaTotalMin,
          etaTotalMax: etaSnapshot.etaTotalMax,
          customerNote: input.customerNote?.trim() || null,
          scheduledFor,
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
            orderId: created.id,
            title: 'ახალი შეკვეთა',
            message: `${created.orderNumber} — ${owner.name}`,
            type: 'ORDER_NEW',
          },
        });
      }

      await this.orderNotifications.notifyCustomerStatus(tx, {
        userId: created.userId,
        orderId: created.id,
        orderNumber: created.orderNumber,
        status: 'PENDING',
      });

      return created;
    });

    this.orderEvents.emit({
      orderId: order.id,
      type: 'STATUS',
      status: order.status,
      at: new Date().toISOString(),
    });

    return { order: this.mapOrder(order) };
  }

  async cancelForUser(
    userId: string,
    orderId: string,
    reason?: string | null,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    if (!CUSTOMER_CANCEL_STATUSES.includes(order.status)) {
      throw new BadRequestException('ამ ეტაპზე შეკვეთის გაუქმება შეუძლებელია');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: reason?.trim() || null,
          cancelledByRole: 'CUSTOMER',
        },
        include: orderInclude,
      });

      await this.orderNotifications.notifyCustomerStatus(tx, {
        userId: next.userId,
        orderId: next.id,
        orderNumber: next.orderNumber,
        status: 'CANCELLED',
        previousStatus: order.status,
      });

      return next;
    });

    this.orderEvents.emit({
      orderId: updated.id,
      type: 'STATUS',
      status: updated.status,
      at: new Date().toISOString(),
    });

    return { order: this.mapOrder(updated) };
  }

  async createReview(
    userId: string,
    orderId: string,
    input: {
      rating: number;
      deliveryRating: number;
      comment?: string | null;
    },
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { review: true },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    if (order.status !== 'DELIVERED') {
      throw new BadRequestException('მიმოხილვა მხოლოდ მიწოდების შემდეგ');
    }
    if (order.review) {
      throw new BadRequestException('ამ შეკვეთაზე მიმოხილვა უკვე არსებობს');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          userId,
          restaurantId: order.restaurantId,
          orderId: order.id,
          rating: input.rating,
          deliveryRating: input.deliveryRating,
          comment: input.comment?.trim() || null,
        },
      });

      if (order.courierId) {
        const stats = await tx.review.aggregate({
          where: {
            deliveryRating: { not: null },
            order: { courierId: order.courierId },
          },
          _avg: { deliveryRating: true },
        });
        const avg = stats._avg.deliveryRating;
        if (avg != null) {
          await tx.courier.updateMany({
            where: { userId: order.courierId },
            data: { rating: Number(avg.toFixed(2)) },
          });
        }
      }

      return created;
    });

    return {
      review: {
        rating: review.rating,
        deliveryRating: review.deliveryRating,
        comment: review.comment,
      },
    };
  }

  private resolveInitialPaymentStatus(method: PaymentMethod): PaymentStatus {
    if (method === 'CARD' || method === 'APPLE_PAY' || method === 'GOOGLE_PAY') {
      return 'PAID';
    }
    return 'PENDING';
  }
}
