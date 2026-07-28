import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
] as const;

@Injectable()
export class RestaurantPanelService {
  constructor(private prisma: PrismaService) {}

  private async getOwnedRestaurant(userId: string, role: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: role === 'ADMIN' ? undefined : { ownerId: userId },
      include: {
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }
    return restaurant;
  }

  async getDashboard(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const activeOrdersCount = await this.prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
      },
    });
    return { restaurant, activeOrdersCount };
  }

  async getProfile(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    return { restaurant };
  }

  async getProducts(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const products = await this.prisma.product.findMany({
      where: { restaurantId: restaurant.id },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
    return { restaurant, products };
  }

  async getOrders(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const orders = await this.prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
    return { restaurant, orders };
  }

  async getActiveOrders(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId: restaurant.id,
        status: { in: [...ACTIVE_ORDER_STATUSES] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        items: true,
      },
    });
    return { restaurant, orders };
  }
}
