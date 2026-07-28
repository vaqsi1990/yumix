import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const AVAILABLE_STATUSES = ['READY', 'ACCEPTED'] as const;
const ACTIVE_STATUSES = ['PICKED_UP', 'ON_THE_WAY'] as const;

@Injectable()
export class CourierService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(courierUserId: string) {
    const [availableCount, myActiveCount, deliveredCount] = await Promise.all([
      this.prisma.order.count({
        where: {
          courierId: null,
          status: { in: [...AVAILABLE_STATUSES] },
        },
      }),
      this.prisma.order.count({
        where: {
          courierId: courierUserId,
          status: { in: [...ACTIVE_STATUSES] },
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
        status: { in: [...AVAILABLE_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: { select: { name: true, address: true, city: true } },
        address: true,
      },
    });
    return { orders };
  }

  async getActive(courierUserId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        courierId: courierUserId,
        status: { in: [...ACTIVE_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: { select: { name: true } },
        address: true,
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
    return { orders };
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
        restaurant: { select: { name: true } },
      },
    });
    return { orders };
  }
}
