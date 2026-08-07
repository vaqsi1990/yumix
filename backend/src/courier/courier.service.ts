import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { OrderStatus } from '../generated/prisma/client';
import { orderInclude } from '../common/order.utils';

const AVAILABLE_STATUSES: OrderStatus[] = ['READY'];
const ACTIVE_STATUSES: OrderStatus[] = ['PICKED_UP', 'ON_THE_WAY'];

const COURIER_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
};

@Injectable()
export class CourierService {
  constructor(private prisma: PrismaService) {}

  private mapOrder(order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    paymentMethod: string;
    paymentStatus: string;
    estimatedTime: number | null;
    createdAt: Date;
    restaurant: { name: string; address: string; city: string; phone: string };
    address: {
      city: string;
      street: string;
      building: string | null;
      entrance: string | null;
      floor: string | null;
      apartment: string | null;
      deliveryNote: string | null;
    };
    user?: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      estimatedTime: order.estimatedTime,
      createdAt: order.createdAt.toISOString(),
      restaurant: order.restaurant,
      address: order.address,
      customer: order.user
        ? {
            name: `${order.user.firstName} ${order.user.lastName}`.trim(),
            phone: order.user.phone,
          }
        : null,
    };
  }

  async getDashboard(courierUserId: string) {
    const [availableCount, myActiveCount, deliveredCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          courierId: null,
          status: { in: AVAILABLE_STATUSES },
        },
      }),
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

    return { availableCount, myActiveCount, deliveredCount };
  }

  async getAvailable() {
    const orders = await this.prisma.order.findMany({
      where: {
        courierId: null,
        status: { in: AVAILABLE_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          select: { name: true, address: true, city: true, phone: true },
        },
        address: true,
      },
    });
    return { orders: orders.map((o) => this.mapOrder(o)) };
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
          select: { name: true, address: true, city: true, phone: true },
        },
        address: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
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
        restaurant: { select: { name: true, address: true, city: true, phone: true } },
        address: true,
      },
    });
    return { orders: orders.map((o) => this.mapOrder(o)) };
  }

  async acceptOrder(courierUserId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    if (order.status !== 'READY') {
      throw new BadRequestException('შეკვეთა მზად არ არის');
    }
    if (order.courierId) {
      throw new BadRequestException('შეკვეთა უკვე მიღებულია');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: {
          courierId: courierUserId,
          status: 'PICKED_UP',
        },
        include: orderInclude,
      });

      await tx.notification.create({
        data: {
          userId: next.userId,
          title: 'კურიერი გზაშია',
          message: `შეკვეთა ${next.orderNumber} აღებულია`,
          type: 'ORDER_STATUS',
        },
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

    const allowed = COURIER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }

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

      await tx.notification.create({
        data: {
          userId: next.userId,
          title: 'შეკვეთის სტატუსი',
          message: `${next.orderNumber}: ${status}`,
          type: 'ORDER_STATUS',
        },
      });

      return next;
    });

    return { order: this.mapOrder(updated) };
  }
}
