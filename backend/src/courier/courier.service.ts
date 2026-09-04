import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { OrderStatus } from '../generated/prisma/client';
import { orderInclude } from '../common/order.utils';
import {
  assertOrderTransition,
  COURIER_ORDER_TRANSITIONS,
  notifyCustomerOrderStatus,
} from '../common/order-status.utils';
import { etaFromOrderSnapshot } from '../common/eta.utils';

const AVAILABLE_STATUSES: OrderStatus[] = ['READY'];
const UPCOMING_STATUSES: OrderStatus[] = ['PENDING', 'ACCEPTED', 'PREPARING'];
const ACTIVE_STATUSES: OrderStatus[] = ['PICKED_UP', 'ON_THE_WAY'];

@Injectable()
export class CourierService {
  constructor(private prisma: PrismaService) {}

  private async getCourierProfile(userId: string) {
    let profile = await this.prisma.courier.findUnique({
      where: { userId },
    });
    if (!profile) {
      profile = await this.prisma.courier.create({
        data: { userId, vehicleType: 'BICYCLE', isOnline: false },
      });
    }
    return profile;
  }

  private mapOrder(
    order: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
      total: number;
      paymentMethod: string;
      paymentStatus: string;
      estimatedTime: number | null;
      etaPrepMin: number | null;
      etaPrepMax: number | null;
      etaTravelMin: number | null;
      etaTravelMax: number | null;
      etaTotalMin: number | null;
      etaTotalMax: number | null;
      customerNote: string | null;
      createdAt: Date;
      restaurant: {
        name: string;
        address: string;
        city: string;
        phone: string;
        latitude?: number | null;
        longitude?: number | null;
      };
      address: {
        city: string;
        street: string;
        building: string | null;
        entrance: string | null;
        floor: string | null;
        apartment: string | null;
        deliveryNote: string | null;
        latitude?: number | null;
        longitude?: number | null;
      };
      user?: {
        firstName: string;
        lastName: string;
        phone: string;
      };
      items?: Array<{
        id: string;
        quantity: number;
        total: number;
        product: { name: string };
        variant: { name: string } | null;
      }>;
    },
  ) {
    const eta = etaFromOrderSnapshot(order);
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      estimatedTime: order.estimatedTime,
      eta,
      customerNote: order.customerNote,
      createdAt: order.createdAt.toISOString(),
      restaurant: order.restaurant,
      address: order.address,
      customer: order.user
        ? {
            name: `${order.user.firstName} ${order.user.lastName}`.trim(),
            phone: order.user.phone,
          }
        : null,
      items: order.items?.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        total: item.total,
        name: item.product.name,
        variantName: item.variant?.name ?? null,
      })),
    };
  }

  async getStatus(courierUserId: string) {
    const profile = await this.getCourierProfile(courierUserId);
    return {
      isOnline: profile.isOnline,
      location: {
        latitude: profile.currentLatitude,
        longitude: profile.currentLongitude,
        updatedAt: profile.locationUpdatedAt?.toISOString() ?? null,
      },
    };
  }

  async setOnlineStatus(courierUserId: string, isOnline: boolean) {
    const profile = await this.getCourierProfile(courierUserId);
    const updated = await this.prisma.courier.update({
      where: { id: profile.id },
      data: { isOnline },
    });
    return {
      isOnline: updated.isOnline,
      location: {
        latitude: updated.currentLatitude,
        longitude: updated.currentLongitude,
        updatedAt: updated.locationUpdatedAt?.toISOString() ?? null,
      },
    };
  }

  async updateLocation(
    courierUserId: string,
    input: { latitude: number; longitude: number },
  ) {
    const latitude = Number(input.latitude);
    const longitude = Number(input.longitude);
    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException('კოორდინატები არასწორია');
    }

    const profile = await this.getCourierProfile(courierUserId);
    if (!profile.isOnline) {
      throw new BadRequestException('ლოკაციის განახლება მხოლოდ ონლაინ რეჟიმშია შესაძლებელი');
    }

    const activeCount = await this.prisma.order.count({
      where: {
        courierId: courierUserId,
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (activeCount === 0) {
      throw new BadRequestException('აქტიური მიწოდება არ გაქვს');
    }

    const updated = await this.prisma.courier.update({
      where: { id: profile.id },
      data: {
        currentLatitude: latitude,
        currentLongitude: longitude,
        locationUpdatedAt: new Date(),
      },
    });

    return {
      latitude: updated.currentLatitude,
      longitude: updated.currentLongitude,
      updatedAt: updated.locationUpdatedAt?.toISOString() ?? null,
    };
  }

  async getDashboard(courierUserId: string) {
    const profile = await this.getCourierProfile(courierUserId);
    const [availableCount, myActiveCount, deliveredCount] = await Promise.all([
      profile.isOnline
        ? this.prisma.order.count({
            where: {
              courierId: null,
              status: { in: AVAILABLE_STATUSES },
            },
          })
        : Promise.resolve(0),
      this.prisma.order.count({
        where: {
          courierId: courierUserId,
          status: { in: ACTIVE_STATUSES },
        },
      }),
      this.prisma.order.count({
        where: {
          courierId: courierUserId,
          status: 'DELIVERED',
        },
      }),
    ]);

    return {
      isOnline: profile.isOnline,
      availableCount,
      myActiveCount,
      deliveredCount,
    };
  }

  async getAvailable(courierUserId: string) {
    const profile = await this.getCourierProfile(courierUserId);
    if (!profile.isOnline) {
      return { orders: [], upcoming: [], isOnline: false };
    }

    const include = {
      restaurant: {
        select: {
          name: true,
          address: true,
          city: true,
          phone: true,
          latitude: true,
          longitude: true,
        },
      },
      address: true,
      items: {
        take: 5,
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
        },
      },
    } as const;

    const [orders, upcoming] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          courierId: null,
          status: { in: AVAILABLE_STATUSES },
        },
        orderBy: { createdAt: 'desc' },
        include,
      }),
      this.prisma.order.findMany({
        where: {
          courierId: null,
          status: { in: UPCOMING_STATUSES },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include,
      }),
    ]);

    return {
      orders: orders.map((o) => this.mapOrder(o)),
      upcoming: upcoming.map((o) => this.mapOrder(o)),
      isOnline: true,
    };
  }

  async getActive(courierUserId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        courierId: courierUserId,
        status: { in: ACTIVE_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true,
            latitude: true,
            longitude: true,
          },
        },
        address: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true } },
          },
        },
      },
    });
    return { orders: orders.map((o) => this.mapOrder(o)) };
  }

  async getHistory(courierUserId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        courierId: courierUserId,
        status: 'DELIVERED',
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        restaurant: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true,
          },
        },
        address: true,
      },
    });
    return { orders: orders.map((o) => this.mapOrder(o)) };
  }

  async acceptOrder(courierUserId: string, orderId: string) {
    const profile = await this.getCourierProfile(courierUserId);
    if (!profile.isOnline) {
      throw new BadRequestException('გახდი ონლაინში შეკვეთის მისაღებად');
    }

    const activeCount = await this.prisma.order.count({
      where: {
        courierId: courierUserId,
        status: { in: ACTIVE_STATUSES },
      },
    });
    if (activeCount > 0) {
      throw new BadRequestException('ჯერ დაასრულე აქტიური მიწოდება');
    }

    const existing = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, courierId: true, orderNumber: true },
    });
    if (!existing) {
      throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    }
    if (existing.courierId && existing.courierId !== courierUserId) {
      throw new BadRequestException('შეკვეთა უკვე მიღებულია სხვა კურიერის მიერ');
    }
    if (existing.status !== 'READY') {
      throw new BadRequestException(
        `შეკვეთა #${existing.orderNumber} ჯერ არ არის მზად (სტატუსი: ${existing.status}). რესტორანმა უნდა დააყენოს «მზადაა».`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'READY',
          courierId: null,
        },
        data: {
          courierId: courierUserId,
          status: 'PICKED_UP',
        },
      });

      if (result.count === 0) {
        throw new BadRequestException('შეკვეთა უკვე მიღებულია ან მიუწვდომელია');
      }

      const next = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: orderInclude,
      });

      await notifyCustomerOrderStatus(tx, {
        userId: next.userId,
        orderId: next.id,
        orderNumber: next.orderNumber,
        status: 'PICKED_UP',
        previousStatus: 'READY',
      });

      return next;
    });

    return { order: this.mapOrder(updated) };
  }

  async updateStatus(
    courierUserId: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, courierId: courierUserId },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    assertOrderTransition(order.status, status, COURIER_ORDER_TRANSITIONS);

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === 'DELIVERED' && order.paymentMethod === 'CASH'
            ? { paymentStatus: 'PAID' }
            : {}),
        },
        include: orderInclude,
      });

      if (status === 'DELIVERED' && order.paymentMethod === 'CASH') {
        await tx.payment.updateMany({
          where: { orderId },
          data: { status: 'PAID', paidAt: new Date() },
        });
      }

      await notifyCustomerOrderStatus(tx, {
        userId: next.userId,
        orderId: next.id,
        orderNumber: next.orderNumber,
        status,
        previousStatus: order.status,
      });

      return next;
    });

    return { order: this.mapOrder(updated) };
  }
}
