import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminService } from '../admin/admin.service';
import {
  DEFAULT_USER_PREFERENCES,
  type UpdatePreferencesDto,
  type UpdateProfileDto,
} from './dto/account.schemas';

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'ON_THE_WAY',
] as const;

@Injectable()
export class AccountService {
  constructor(
    private prisma: PrismaService,
    private admin: AdminService,
  ) {}

  private parsePreferences(raw: unknown) {
    const base = { ...DEFAULT_USER_PREFERENCES };
    if (!raw || typeof raw !== 'object') return base;
    const obj = raw as Record<string, unknown>;
    return {
      orderUpdates:
        typeof obj.orderUpdates === 'boolean'
          ? obj.orderUpdates
          : base.orderUpdates,
      promotions:
        typeof obj.promotions === 'boolean' ? obj.promotions : base.promotions,
      newRestaurants:
        typeof obj.newRestaurants === 'boolean'
          ? obj.newRestaurants
          : base.newRestaurants,
      discounts:
        typeof obj.discounts === 'boolean' ? obj.discounts : base.discounts,
      language:
        obj.language === 'en' || obj.language === 'ru' || obj.language === 'ka'
          ? obj.language
          : base.language,
      currency: obj.currency === 'GEL' ? 'GEL' : base.currency,
    };
  }

  async getDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });
    if (!user) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');

    const [
      defaultAddress,
      activeOrder,
      recentOrders,
      favoriteRestaurants,
      recommendedRestaurants,
      unreadNotifications,
    ] = await Promise.all([
      this.prisma.address.findFirst({
        where: { userId, isDefault: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.findFirst({
        where: {
          userId,
          status: { in: [...ACTIVE_ORDER_STATUSES] },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          restaurant: {
            select: { id: true, name: true, slug: true, logo: true },
          },
        },
      }),
      this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          restaurant: {
            select: { id: true, name: true, slug: true, logo: true },
          },
          items: {
            take: 2,
            include: {
              product: { select: { id: true, name: true, image: true } },
            },
          },
        },
      }),
      this.prisma.favoriteRestaurant.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          restaurant: {
            include: {
              categories: { include: { category: { select: { name: true } } } },
              reviews: { select: { rating: true } },
              _count: { select: { reviews: true } },
            },
          },
        },
      }),
      this.prisma.restaurant.findMany({
        where: { isApproved: true, isOpen: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          categories: { include: { category: { select: { name: true } } } },
          reviews: { select: { rating: true } },
          _count: { select: { reviews: true } },
        },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      user,
      defaultAddress,
      activeOrder: activeOrder
        ? {
            id: activeOrder.id,
            orderNumber: activeOrder.orderNumber,
            status: activeOrder.status,
            estimatedTime: activeOrder.estimatedTime,
            total: activeOrder.total,
            restaurant: activeOrder.restaurant,
          }
        : null,
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        restaurant: order.restaurant,
        items: order.items.map((item) => ({
          quantity: item.quantity,
          product: item.product,
        })),
      })),
      favoriteRestaurants: favoriteRestaurants.map((row) =>
        this.mapRestaurantCard(row.restaurant),
      ),
      recommendedRestaurants: recommendedRestaurants.map((r) =>
        this.mapRestaurantCard(r),
      ),
      unreadNotifications,
    };
  }

  private mapRestaurantCard(
    restaurant: {
      id: string;
      name: string;
      slug: string;
      logo: string | null;
      coverImage: string | null;
      deliveryFee: number | null;
      minimumOrder: number | null;
      isOpen: boolean;
      categories: { category: { name: string } }[];
      reviews: { rating: number }[];
      _count: { reviews: number };
    },
  ) {
    const reviewCount = restaurant._count.reviews;
    const rating =
      reviewCount > 0
        ? restaurant.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0;
    const categoryNames = restaurant.categories
      .map((c) => c.category.name)
      .join(', ');

    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      logo: restaurant.logo,
      coverImage: restaurant.coverImage,
      categories: categoryNames,
      rating: Number(rating.toFixed(1)),
      reviewCount,
      deliveryFee: restaurant.deliveryFee,
      minimumOrder: restaurant.minimumOrder,
      isOpen: restaurant.isOpen,
      deliveryTime: restaurant.isOpen ? '25-45 წთ' : 'დახურულია',
    };
  }

  getProfile(userId: string) {
    return this.admin.getSettings(userId);
  }

  updateProfile(userId: string, body: UpdateProfileDto) {
    return this.admin.updateSettings(userId, body);
  }

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });
    if (!user) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');
    return { preferences: this.parsePreferences(user.preferences) };
  }

  async updatePreferences(userId: string, body: UpdatePreferencesDto) {
    const current = await this.getPreferences(userId);
    const next = { ...current.preferences, ...body };
    await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: next },
    });
    return { preferences: next };
  }

  async deleteAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    await this.prisma.cart.deleteMany({ where: { userId } });
    return { deleted: true };
  }

  async listFavoriteRestaurants(userId: string) {
    const rows = await this.prisma.favoriteRestaurant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        restaurant: {
          include: {
            categories: { include: { category: { select: { name: true } } } },
            reviews: { select: { rating: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
    });
    return {
      restaurants: rows.map((row) => ({
        favoriteId: row.id,
        ...this.mapRestaurantCard(row.restaurant),
      })),
    };
  }

  async addFavoriteRestaurant(userId: string, restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: { id: restaurantId, isApproved: true },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    const favorite = await this.prisma.favoriteRestaurant.upsert({
      where: { userId_restaurantId: { userId, restaurantId } },
      create: { userId, restaurantId },
      update: {},
    });
    return { favorite };
  }

  async removeFavoriteRestaurant(userId: string, restaurantId: string) {
    await this.prisma.favoriteRestaurant.deleteMany({
      where: { userId, restaurantId },
    });
    return { removed: true };
  }

  async getFavoritesSummary(userId: string) {
    const [restaurants, products] = await Promise.all([
      this.prisma.favoriteRestaurant.findMany({
        where: { userId },
        select: { restaurantId: true },
      }),
      this.prisma.favoriteProduct.findMany({
        where: { userId },
        select: { productId: true },
      }),
    ]);

    return {
      restaurantIds: restaurants.map((row) => row.restaurantId),
      productIds: products.map((row) => row.productId),
    };
  }

  async listFavoriteProducts(userId: string) {
    const rows = await this.prisma.favoriteProduct.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          include: {
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                isOpen: true,
              },
            },
            variants: { orderBy: { name: 'asc' } },
            customizationGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  where: { isAvailable: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    return {
      products: rows
        .filter((row) => !row.product.isHidden && row.product.isAvailable)
        .map((row) => ({
          favoriteId: row.id,
          id: row.product.id,
          name: row.product.name,
          image: row.product.image,
          price: row.product.price,
          discountPrice: row.product.discountPrice,
          outOfStock: row.product.outOfStock,
          restaurant: row.product.restaurant,
          variants: row.product.variants,
          customizationGroups: row.product.customizationGroups
            .filter((group) => group.options.length > 0)
            .map((group) => ({
            id: group.id,
            name: group.name,
            description: group.description,
            kind: group.kind === 'exclusion' ? 'exclusion' : 'option',
            required: group.required,
              minSelections: group.minSelections,
              maxSelections: group.maxSelections,
              sortOrder: group.sortOrder,
              options: group.options.map((option) => ({
                id: option.id,
                name: option.name,
                price: option.price,
              })),
            })),
        })),
    };
  }

  async addFavoriteProduct(userId: string, productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isHidden: false, isAvailable: true },
    });
    if (!product) throw new NotFoundException('პროდუქტი ვერ მოიძებნა');

    const favorite = await this.prisma.favoriteProduct.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
    });
    return { favorite };
  }

  async removeFavoriteProduct(userId: string, productId: string) {
    await this.prisma.favoriteProduct.deleteMany({
      where: { userId, productId },
    });
    return { removed: true };
  }

  async listNotifications(userId: string, take = 30) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  async markNotificationRead(userId: string, id: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notification) throw new NotFoundException('შეტყობინება ვერ მოიძებნა');

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { ok: true };
  }

  async markAllNotificationsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { ok: true };
  }
}
