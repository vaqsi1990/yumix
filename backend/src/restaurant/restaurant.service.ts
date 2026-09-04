import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminService,
  type ProductWriteInput,
} from '../admin/admin.service';
import { sortVariantsBySize } from '../common/product-sizes';
import { ensureStandardMenuCategories } from '../common/ensure-menu-categories';
import { assertValidIban, assertRestaurantHasIban, isValidIban } from '../common/iban.utils';
import {
  isStandardMenuCategory,
  onlyStandardMenuCategories,
} from '../common/menu-category-order';
import { ADDON_CARRIER_PRODUCT_NAME } from '../common/addon-categories';
import {
  assertOrderTransition,
  notifyCustomerOrderStatus,
  OWNER_ORDER_TRANSITIONS,
} from '../common/order-status.utils';
import type { OrderStatus, Prisma } from '../generated/prisma/client';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
];

const restaurantOrderItemInclude = {
  product: { select: { name: true } },
  variant: { select: { name: true } },
  addOns: { include: { addon: { select: { name: true } } } },
  customizations: true,
} as const;

const DAY_NAMES = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
] as const;

const DAY_INDEX: Record<string, number> = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

@Injectable()
export class RestaurantPanelService {
  constructor(
    private prisma: PrismaService,
    private admin: AdminService,
  ) {}

  private async findOwnedRestaurant(userId: string, role: string) {
    return this.prisma.restaurant.findFirst({
      where: role === 'ADMIN' ? undefined : { ownerId: userId },
      include: {
        workingHours: { orderBy: { day: 'asc' } },
        _count: { select: { products: true, orders: true, reviews: true } },
      },
    });
  }

  private async getOwnedRestaurant(userId: string, role: string) {
    const restaurant = await this.findOwnedRestaurant(userId, role);
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }
    return restaurant;
  }

  async getShell(userId: string, role: string) {
    const account = await this.admin.getSettings(userId);
    const restaurant = await this.findOwnedRestaurant(userId, role);

    if (!restaurant) {
      return {
        hasRestaurant: false as const,
        owner: account.user,
        pendingOrders: 0,
      };
    }

    const pendingOrders = await this.prisma.order.count({
      where: { restaurantId: restaurant.id, status: 'PENDING' },
    });

    return {
      hasRestaurant: true as const,
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        logo: restaurant.logo,
        coverImage: restaurant.coverImage,
        isApproved: restaurant.isApproved,
        isOpen: restaurant.isOpen,
        hasIban: isValidIban(restaurant.iban),
        _count: restaurant._count,
      },
      owner: account.user,
      pendingOrders,
    };
  }

  async createOwnRestaurant(
    userId: string,
    role: string,
    body: Record<string, unknown>,
  ) {
    if (role !== 'RESTAURANT_OWNER' && role !== 'ADMIN') {
      throw new BadRequestException('მხოლოდ რესტორნის მფლობელს შეუძლია რესტორანის შექმნა');
    }

    const existing = await this.findOwnedRestaurant(userId, role);
    if (existing) {
      throw new BadRequestException('თქვენს ანგარიშს უკვე აქვს რესტორანი');
    }

    const sellerBody = { ...body };
    delete sellerBody.deliveryFee;
    delete sellerBody.deliveryRadius;
    delete sellerBody.deliveryFeePerKm;

    return this.admin.createRestaurant({
      ...sellerBody,
      ownerId: userId,
      approved: false,
      acceptingOrders: false,
    });
  }

  private startOfToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private startOfMonth() {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  async getDashboard(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const today = this.startOfToday();
    const monthStart = this.startOfMonth();

    const [
      todayOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      todayRevenueAgg,
      monthlyRevenueAgg,
      ratingAgg,
      recentOrders,
      latestReviews,
      popularProducts,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { restaurantId: restaurant.id, createdAt: { gte: today } },
      }),
      this.prisma.order.count({
        where: { restaurantId: restaurant.id, status: 'PENDING' },
      }),
      this.prisma.order.count({
        where: { restaurantId: restaurant.id, status: 'PREPARING' },
      }),
      this.prisma.order.count({
        where: { restaurantId: restaurant.id, status: 'READY' },
      }),
      this.prisma.order.count({
        where: {
          restaurantId: restaurant.id,
          status: 'DELIVERED',
          createdAt: { gte: today },
        },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: today },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      this.prisma.order.aggregate({
        where: {
          restaurantId: restaurant.id,
          createdAt: { gte: monthStart },
          paymentStatus: 'PAID',
        },
        _sum: { total: true },
      }),
      this.prisma.review.aggregate({
        where: { restaurantId: restaurant.id },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.order.findMany({
        where: { restaurantId: restaurant.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.review.findMany({
        where: { restaurantId: restaurant.id },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          order: { select: { orderNumber: true } },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { restaurantId: restaurant.id } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const productIds = popularProducts.map((p) => p.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          include: { category: true },
        })
      : [];

    const productMap = new Map(products.map((p) => [p.id, p]));

    const activeOrdersCount = await this.prisma.order.count({
      where: {
        restaurantId: restaurant.id,
        status: { in: ACTIVE_ORDER_STATUSES },
      },
    });

    return {
      restaurant,
      activeOrdersCount,
      stats: {
        todayOrders,
        pendingOrders,
        preparingOrders,
        readyOrders,
        completedOrders,
        todayRevenue: todayRevenueAgg._sum.total ?? 0,
        monthlyRevenue: monthlyRevenueAgg._sum.total ?? 0,
        averageRating: ratingAgg._avg.rating ?? 0,
        totalReviews: ratingAgg._count.rating ?? 0,
      },
      recentOrders: recentOrders.map((o) => this.mapOrderSummary(o)),
      latestReviews: latestReviews.map((r) => this.mapReview(r)),
      popularProducts: popularProducts
        .map((row) => {
          const product = productMap.get(row.productId);
          if (!product) return null;
          return {
            id: product.id,
            name: product.name,
            image: product.image,
            categoryName: product.category.name,
            price: product.price,
            discountPrice: product.discountPrice,
            orderCount: row._sum.quantity ?? 0,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    };
  }

  async getAnalytics(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const monthStart = this.startOfMonth();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const [monthlyRevenueAgg, ordersByDayRaw, bestSellers, categoryGroups] =
      await Promise.all([
        this.prisma.order.aggregate({
          where: {
            restaurantId: restaurant.id,
            createdAt: { gte: monthStart },
            paymentStatus: 'PAID',
          },
          _sum: { total: true },
        }),
        this.prisma.order.findMany({
          where: {
            restaurantId: restaurant.id,
            createdAt: { gte: weekAgo },
          },
          select: { createdAt: true, total: true },
        }),
        this.prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { restaurantId: restaurant.id } },
          _sum: { quantity: true, total: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        this.prisma.product.groupBy({
          by: ['categoryId'],
          where: { restaurantId: restaurant.id },
          _count: { id: true },
        }),
      ]);

    const productIds = bestSellers.map((b) => b.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true },
        })
      : [];
    const productNameMap = new Map(products.map((p) => [p.id, p.name]));

    const categoryIds = categoryGroups.map((c) => c.categoryId);
    const categories = categoryIds.length
      ? await this.prisma.productCategory.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];
    const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));
    const totalProducts = categoryGroups.reduce((s, c) => s + c._count.id, 0);

    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const ordersByDay = dayLabels.map((day, index) => ({
      day,
      orders: ordersByDayRaw.filter((o) => o.createdAt.getDay() === index)
        .length,
    }));

    const weekOrders = ordersByDayRaw.length;
    const monthlyRevenue = monthlyRevenueAgg._sum.total ?? 0;

    return {
      monthlyRevenue,
      weekOrders,
      avgOrderValue: weekOrders > 0 ? monthlyRevenue / weekOrders : 0,
      ordersByDay,
      bestSellers: bestSellers.map((b) => ({
        name: productNameMap.get(b.productId) ?? 'Unknown',
        orders: b._sum.quantity ?? 0,
        revenue: b._sum.total ?? 0,
      })),
      popularCategories: categoryGroups.map((c) => ({
        name: categoryNameMap.get(c.categoryId) ?? 'Unknown',
        percentage:
          totalProducts > 0
            ? Math.round((c._count.id / totalProducts) * 100)
            : 0,
      })),
    };
  }

  async getMenu(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    await ensureStandardMenuCategories(this.prisma, restaurant.id);
    const categories = await this.prisma.productCategory.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { deletedAt: null },
          include: {
            category: true,
            variants: { orderBy: { name: 'asc' } },
            customizationGroups: {
              orderBy: { sortOrder: 'asc' },
              include: {
                options: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    });

    const ordered = onlyStandardMenuCategories(categories);

    return {
      restaurant,
      categories: ordered.map((cat) => ({
        id: cat.id,
        restaurantId: restaurant.id,
        name: cat.name,
        sortOrder: cat.sortOrder,
        _count: cat._count,
      })),
      menu: ordered.map((cat) => {
        const products = cat.products
          .filter((p) => p.name !== ADDON_CARRIER_PRODUCT_NAME)
          .map((p) => this.mapProduct(p));
        const visibleProducts = products.filter((p) => !p.isHidden);
        const coverProduct = visibleProducts[0] ?? products[0] ?? null;
        const isStandard = isStandardMenuCategory(cat.name);
        return {
          id: cat.id,
          name: cat.name,
          description: null,
          image: coverProduct?.image ?? null,
          productsCount: products.length,
          sortOrder: cat.sortOrder,
          visible: isStandard || visibleProducts.length > 0,
          products,
        };
      }),
    };
  }

  async getCategories(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    await ensureStandardMenuCategories(this.prisma, restaurant.id);
    const { categories } = await this.admin.listProductCategories(
      restaurant.id,
    );
    return { restaurant, categories: onlyStandardMenuCategories(categories) };
  }

  async createCategory(
    _userId: string,
    _role: string,
    _body: { name: string; sortOrder?: number },
  ) {
    throw new BadRequestException('კატეგორიების ხელით დამატება არ შეიძლება');
  }

  async updateCategory(
    userId: string,
    role: string,
    id: string,
    body: { name?: string; sortOrder?: number },
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const existing = await this.prisma.productCategory.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing) throw new NotFoundException('კატეგორია ვერ მოიძებნა');
    if (isStandardMenuCategory(existing.name) && body.name && body.name !== existing.name) {
      throw new BadRequestException('სტანდარტული კატეგორიის სახელი არ იცვლება');
    }
    return this.admin.updateProductCategory(id, body);
  }

  async deleteCategory(userId: string, role: string, id: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const existing = await this.prisma.productCategory.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing) throw new NotFoundException('კატეგორია ვერ მოიძებნა');
    if (isStandardMenuCategory(existing.name)) {
      throw new BadRequestException('სტანდარტული კატეგორია არ იშლება');
    }
    return this.admin.deleteProductCategory(id);
  }

  async reorderCategories(
    userId: string,
    role: string,
    ids: string[],
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids array is required');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.productCategory.updateMany({
          where: { id, restaurantId: restaurant.id },
          data: { sortOrder: index },
        }),
      ),
    );

    return this.getCategories(userId, role);
  }

  async toggleMenuCategoryVisibility(
    userId: string,
    role: string,
    id: string,
    visible: boolean,
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const category = await this.prisma.productCategory.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!category) throw new NotFoundException('კატეგორია ვერ მოიძებნა');

    await this.prisma.product.updateMany({
      where: { categoryId: id, restaurantId: restaurant.id },
      data: { isHidden: !visible },
    });

    return this.getMenu(userId, role);
  }

  async getProducts(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    await ensureStandardMenuCategories(this.prisma, restaurant.id);
    const products = await this.prisma.product.findMany({
      where: { restaurantId: restaurant.id, deletedAt: null },
      include: {
        category: true,
        variants: { orderBy: { name: 'asc' } },
        customizationGroups: {
          orderBy: { sortOrder: 'asc' },
          include: {
            options: { orderBy: { sortOrder: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const { categories } = await this.admin.listProductCategories(
      restaurant.id,
    );

    return {
      restaurant,
      products: products.map((p) => this.mapProduct(p)),
      categories: onlyStandardMenuCategories(categories),
    };
  }

  async createProduct(
    userId: string,
    role: string,
    input: Omit<ProductWriteInput, 'restaurantId'>,
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    assertRestaurantHasIban(restaurant.iban);
    return this.admin.createProduct({
      ...input,
      restaurantId: restaurant.id,
      variants: input.variants ?? [],
      customizationGroups: input.customizationGroups ?? [],
    });
  }

  async updateProduct(
    userId: string,
    role: string,
    id: string,
    input: Omit<ProductWriteInput, 'restaurantId'>,
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const existing = await this.prisma.product.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing) throw new NotFoundException('პროდუქტი ვერ მოიძებნა');
    return this.admin.updateProduct(id, {
      ...input,
      restaurantId: restaurant.id,
      variants: input.variants ?? [],
      customizationGroups: input.customizationGroups ?? [],
    });
  }

  async deleteProduct(userId: string, role: string, id: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const existing = await this.prisma.product.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing) throw new NotFoundException('პროდუქტი ვერ მოიძებნა');
    if (existing.deletedAt) return { deleted: true };
    return this.admin.deleteProduct(id);
  }

  async duplicateProduct(userId: string, role: string, id: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    assertRestaurantHasIban(restaurant.iban);
    const existing = await this.prisma.product.findFirst({
      where: { id, restaurantId: restaurant.id },
    });
    if (!existing) throw new NotFoundException('პროდუქტი ვერ მოიძებნა');
    return this.admin.duplicateProduct(id);
  }

  async listAddons(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    return this.admin.listRestaurantAddons(restaurant.id);
  }

  async createAddon(
    userId: string,
    role: string,
    input: { name: string; price: number; category?: string },
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    return this.admin.createRestaurantAddon(restaurant.id, input);
  }

  async updateAddon(
    userId: string,
    role: string,
    id: string,
    input: { name?: string; price?: number; category?: string },
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    await this.assertAddonBelongsToRestaurant(id, restaurant.id);
    return this.admin.updateRestaurantAddon(id, input);
  }

  async deleteAddon(userId: string, role: string, id: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    await this.assertAddonBelongsToRestaurant(id, restaurant.id);
    return this.admin.deleteRestaurantAddon(id);
  }

  private async assertAddonBelongsToRestaurant(
    addonId: string,
    restaurantId: string,
  ) {
    const addon = await this.prisma.productAddon.findUnique({
      where: { id: addonId },
      select: { restaurantId: true },
    });
    if (!addon || addon.restaurantId !== restaurantId) {
      throw new NotFoundException('დამატება ვერ მოიძებნა');
    }
  }

  async getOrders(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const orders = await this.prisma.order.findMany({
      where: { restaurantId: restaurant.id },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        address: true,
        items: {
          include: restaurantOrderItemInclude,
        },
        _count: { select: { items: true } },
      },
    });
    return {
      restaurant,
      orders: orders.map((o) => this.mapOrderDetail(o)),
    };
  }

  async getOrder(userId: string, role: string, orderId: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        address: true,
        items: {
          include: restaurantOrderItemInclude,
        },
      },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    return { order: this.mapOrderDetail(order) };
  }

  async updateOrderStatus(
    userId: string,
    role: string,
    orderId: string,
    status: OrderStatus,
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, restaurantId: restaurant.id },
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    assertOrderTransition(order.status, status, OWNER_ORDER_TRANSITIONS);

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          address: true,
          items: {
            include: restaurantOrderItemInclude,
          },
          _count: { select: { items: true } },
        },
      });

      await notifyCustomerOrderStatus(tx, {
        userId: next.userId,
        orderId: next.id,
        orderNumber: next.orderNumber,
        status,
        previousStatus: order.status,
      });

      return next;
    });

    return { order: this.mapOrderDetail(updated) };
  }

  async getReviews(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const reviews = await this.prisma.review.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        order: { select: { orderNumber: true } },
      },
    });
    return {
      restaurant,
      reviews: reviews.map((r) => this.mapReview(r)),
    };
  }

  async deleteReview(userId: string, role: string, reviewId: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    const review = await this.prisma.review.findFirst({
      where: { id: reviewId, restaurantId: restaurant.id },
    });
    if (!review) throw new NotFoundException('მიმოხილვა ვერ მოიძებნა');
    await this.prisma.review.delete({ where: { id: reviewId } });
    return { deleted: true };
  }

  async getSettings(userId: string, role: string) {
    const restaurant = await this.getOwnedRestaurant(userId, role);
    return {
      settings: this.mapRestaurantSettings(restaurant),
    };
  }

  async updateSettings(
    userId: string,
    role: string,
    body: Record<string, unknown>,
  ) {
    const restaurant = await this.getOwnedRestaurant(userId, role);

    const name = body.name != null ? String(body.name).trim() : undefined;
    const description =
      body.description != null
        ? String(body.description).trim() || null
        : undefined;
    const phone = body.phone != null ? String(body.phone).trim() : undefined;
    const emailRaw =
      body.email != null ? String(body.email).trim() : undefined;
    const email = emailRaw === undefined ? undefined : emailRaw || null;
    const iban =
      body.iban != null ? assertValidIban(body.iban) : undefined;
    const city = body.city != null ? String(body.city).trim() : undefined;
    const address =
      body.address != null ? String(body.address).trim() : undefined;
    const logo = body.logo !== undefined ? (body.logo as string | null) : undefined;
    const coverImage =
      body.coverImage !== undefined
        ? (body.coverImage as string | null)
        : undefined;
    const isOpen =
      typeof body.isOpen === 'boolean' ? body.isOpen : undefined;
    const latitude =
      body.latitude !== undefined ? this.parseOptionalCoord(body.latitude) : undefined;
    const longitude =
      body.longitude !== undefined ? this.parseOptionalCoord(body.longitude) : undefined;

    if (email) {
      const taken = await this.prisma.restaurant.findFirst({
        where: { email, NOT: { id: restaurant.id } },
      });
      if (taken) throw new BadRequestException('Email already in use');
    }

    const workingHours = Array.isArray(body.workingHours)
      ? body.workingHours
      : null;

    await this.prisma.$transaction(async (tx) => {
      await tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(iban !== undefined ? { iban } : {}),
          ...(city !== undefined ? { city } : {}),
          ...(address !== undefined ? { address } : {}),
          ...(logo !== undefined ? { logo } : {}),
          ...(coverImage !== undefined ? { coverImage } : {}),
          ...(isOpen !== undefined ? { isOpen } : {}),
          ...(latitude !== undefined ? { latitude } : {}),
          ...(longitude !== undefined ? { longitude } : {}),
        },
      });

      if (workingHours) {
        await tx.workingHour.deleteMany({
          where: { restaurantId: restaurant.id },
        });
        const rows = workingHours
          .map((row) => {
            const dayKey = String((row as { day?: string }).day ?? '');
            const idx = DAY_INDEX[dayKey] ?? DAY_INDEX[dayKey.toUpperCase()];
            if (idx === undefined) return null;
            return {
              restaurantId: restaurant.id,
              day: idx,
              openTime: this.normalizeClock(
                (row as { open?: string; openTime?: string }).open ??
                  (row as { openTime?: string }).openTime,
                '10:00',
              ),
              closeTime: this.normalizeClock(
                (row as { close?: string; closeTime?: string }).close ??
                  (row as { closeTime?: string }).closeTime,
                '22:00',
              ),
              isClosed: Boolean(
                (row as { closed?: boolean; isClosed?: boolean }).closed ??
                  (row as { isClosed?: boolean }).isClosed,
              ),
            };
          })
          .filter((r): r is NonNullable<typeof r> => r !== null);

        if (rows.length > 0) {
          await tx.workingHour.createMany({ data: rows });
        }
      }
    });

    return this.getSettings(userId, role);
  }

  async getAccount(userId: string) {
    return this.admin.getSettings(userId);
  }

  async updateAccount(
    userId: string,
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      avatar?: string | null;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    return this.admin.updateSettings(userId, body);
  }

  private mapProduct(
    row: Prisma.ProductGetPayload<{
      include: {
        category: true;
        variants: true;
        customizationGroups: { include: { options: true } };
      };
    }>,
  ) {
    let availability: ProductWriteInput['availability'] = 'AVAILABLE';
    if (row.outOfStock) availability = 'OUT_OF_STOCK';
    else if (row.isHidden) availability = 'HIDDEN';
    else if (!row.isAvailable) availability = 'UNAVAILABLE';

    return {
      id: row.id,
      restaurantId: row.restaurantId,
      categoryId: row.categoryId,
      categoryName: row.category.name,
      name: row.name,
      description: row.description,
      image: row.image,
      gallery: row.gallery ?? [],
      price: row.price,
      discountPrice: row.discountPrice,
      preparationTime: row.preparationTime,
      foodType: row.foodType,
      availability,
      isAvailable: row.isAvailable,
      isHidden: row.isHidden,
      outOfStock: row.outOfStock,
      variants: sortVariantsBySize(
        row.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
        })),
      ),
      customizationGroups: (row.customizationGroups ?? []).map((group) => ({
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
          sortOrder: option.sortOrder,
          isAvailable: option.isAvailable,
        })),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapOrderSummary(
    order: Prisma.OrderGetPayload<{
      include: {
        user: {
          select: {
            firstName: true;
            lastName: true;
            phone: true;
            email: true;
          };
        };
        _count: { select: { items: true } };
      };
    }>,
  ) {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
      customerPhone: order.user.phone,
      customerEmail: order.user.email,
      itemsCount: order._count.items,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
    };
  }

  private mapOrderDetail(
    order: {
      id: string;
      orderNumber: string;
      user: {
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
      };
      address: {
        street: string;
        building: string | null;
        city: string;
      };
      items: Array<{
        id: string;
        quantity: number;
        price: number;
        product: { name: string };
        variant?: { name: string } | null;
        addOns: Array<{ addon: { name: string } }>;
        customizations?: Array<{
          groupName: string;
          optionName: string;
          quantity: number;
        }>;
      }>;
      total: number;
      status: OrderStatus;
      paymentStatus: string;
      paymentMethod: string;
      customerNote: string | null;
      createdAt: Date;
      _count?: { items: number };
    },
  ) {
    const itemsCount = order._count?.items ?? order.items.length;
    const addressParts = [
      order.address.street,
      order.address.building,
      order.address.city,
    ].filter(Boolean);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: `${order.user.firstName} ${order.user.lastName}`.trim(),
      customerPhone: order.user.phone,
      customerEmail: order.user.email,
      itemsCount,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt.toISOString(),
      deliveryAddress: addressParts.join(', '),
      notes: order.customerNote,
      items: order.items.map((item) => ({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        variantName: item.variant?.name ?? null,
        addons: item.addOns.map((a) => a.addon.name),
        customizations: (item.customizations ?? []).map((c) => {
          const label = `${c.groupName}: ${c.optionName}`;
          return c.quantity > 1 ? `${label} ×${c.quantity}` : label;
        }),
      })),
    };
  }

  private mapReview(
    review: Prisma.ReviewGetPayload<{
      include: {
        user: {
          select: {
            firstName: true;
            lastName: true;
            avatar: true;
          };
        };
        order: { select: { orderNumber: true } };
      };
    }>,
  ) {
    return {
      id: review.id,
      customerName: `${review.user.firstName} ${review.user.lastName}`.trim(),
      customerAvatar: review.user.avatar,
      rating: review.rating,
      comment: review.comment ?? '',
      orderNumber: review.order.orderNumber,
      createdAt: review.createdAt.toISOString(),
    };
  }

  private mapRestaurantSettings(
    restaurant: Prisma.RestaurantGetPayload<{
      include: { workingHours: true };
    }>,
  ) {
    return {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description ?? '',
      logo: restaurant.logo,
      coverImage: restaurant.coverImage,
      phone: restaurant.phone,
      email: restaurant.email ?? '',
      iban: restaurant.iban,
      city: restaurant.city,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      minimumOrder: restaurant.minimumOrder ?? 0,
      deliveryFee: restaurant.deliveryFee ?? 0,
      deliveryFeePerKm: restaurant.deliveryFeePerKm ?? 0,
      deliveryRadius: restaurant.deliveryRadius,
      isOpen: restaurant.isOpen,
      workingHours: DAY_NAMES.map((name, idx) => {
        const wh = restaurant.workingHours.find((row) => row.day === idx);
        return {
          day: name,
          open: this.normalizeClock(wh?.openTime, '10:00'),
          close: this.normalizeClock(wh?.closeTime, '22:00'),
          closed: wh?.isClosed ?? false,
        };
      }),
    };
  }

  private parseOptionalCoord(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private normalizeClock(value: string | undefined, fallback: string) {
    const match = String(value ?? '').match(/^(\d{1,2}):(\d{2})/);
    if (!match) return fallback;
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
}
