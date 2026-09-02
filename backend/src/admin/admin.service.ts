import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';
import {
  sanitizeProductVariants,
  sortVariantsBySize,
} from '../common/product-sizes';
import { sanitizeCustomizationGroups } from '../common/customization.utils';
import { orderInclude } from '../common/order.utils';
import { notifyCustomerOrderStatus } from '../common/order-status.utils';
import { parseAddonCategory } from '../common/addon-categories';
import { assertComboProductRules } from '../common/combo-product.utils';
import {
  ensureAllRestaurantMenuCategories,
  ensureStandardMenuCategories,
} from '../common/ensure-menu-categories';
import {
  isStandardMenuCategory,
  onlyStandardMenuCategories,
} from '../common/menu-category-order';
import type { OrderStatus } from '../generated/prisma/client';

const ROLES = ['USER', 'COURIER', 'RESTAURANT_OWNER', 'ADMIN'] as const;
type Role = (typeof ROLES)[number];

const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'PICKED_UP',
  'ON_THE_WAY',
] as const;

type ProductAvailability =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'HIDDEN'
  | 'OUT_OF_STOCK';

const DEFAULT_ALLERGENS = {
  gluten: false,
  milk: false,
  eggs: false,
  fish: false,
  nuts: false,
  soy: false,
  vegan: false,
  vegetarian: false,
};

const productInclude = {
  variants: { orderBy: { name: 'asc' as const } },
  customizationGroups: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      options: { orderBy: { sortOrder: 'asc' as const } },
    },
  },
  category: true,
  restaurant: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ProductInclude;

type DbProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
export type ProductCategoryWriteInput = {
  restaurantId: string;
  name: string;
  sortOrder?: number;
};

export type ProductWriteInput = {
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string | null;
  image?: string | null;
  gallery?: string[];
  price: number;
  discountPrice?: number | null;
  calories?: number | null;
  preparationTime?: number | null;
  weight?: number | null;
  foodType?: string | null;
  spicinessLevel?: string | null;
  availability: ProductAvailability;
  allergens?: typeof DEFAULT_ALLERGENS;
  variants: { id?: string; name: string; price: number }[];
  customizationGroups?: {
    id?: string;
    name: string;
    description?: string | null;
    kind?: 'option' | 'exclusion';
    required?: boolean;
    minSelections?: number;
    maxSelections?: number;
    sortOrder?: number;
    options: {
      id?: string;
      name: string;
      price: number;
      sortOrder?: number;
      isAvailable?: boolean;
    }[];
  }[];
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats / lists ───────────────────────────────────────────

  async getStats() {
    const [
      ordersCount,
      usersCount,
      restaurantsCount,
      couriersCount,
      activeOrdersCount,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.user.count(),
      this.prisma.restaurant.count(),
      this.prisma.user.count({ where: { role: 'COURIER' } }),
      this.prisma.order.count({
        where: { status: { in: [...ACTIVE_ORDER_STATUSES] } },
      }),
    ]);
    return {
      ordersCount,
      usersCount,
      restaurantsCount,
      couriersCount,
      activeOrdersCount,
    };
  }

  async getOrders(take = 50) {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        restaurant: { select: { id: true, name: true } },
        courier: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
    });
    return { orders };
  }

  async getActiveOrders() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: [...ACTIVE_ORDER_STATUSES] } },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true, phone: true } },
        restaurant: { select: { name: true, phone: true } },
        courier: {
          select: { firstName: true, lastName: true, phone: true },
        },
        address: {
          select: { city: true, street: true, building: true },
        },
        _count: { select: { items: true } },
      },
    });
    return { orders };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');
    return { order };
  }

  async assignCourier(orderId: string, courierUserId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    const courier = await this.prisma.user.findFirst({
      where: { id: courierUserId, role: 'COURIER', isActive: true },
    });
    if (!courier) throw new BadRequestException('კურიერი ვერ მოიძებნა');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { courierId: courierUserId },
      include: orderInclude,
    });
    return { order: updated };
  }

  async listRestaurantAddons(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    const addOns = await this.prisma.productAddon.findMany({
      where: { restaurantId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    return { addOns };
  }

  async createRestaurantAddon(
    restaurantId: string,
    input: { name: string; price: number; category?: string },
  ) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    const name = input.name?.trim();
    if (!name) {
      throw new BadRequestException('დამატების სახელი სავალდებულოა');
    }
    const price = Number(input.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('ფასი არასწორია');
    }

    const addon = await this.prisma.productAddon.create({
      data: {
        restaurantId,
        name,
        price,
        category: parseAddonCategory(input.category),
      },
    });
    return { addon };
  }

  async updateRestaurantAddon(
    id: string,
    input: { name?: string; price?: number; category?: string },
  ) {
    const existing = await this.prisma.productAddon.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('დამატება ვერ მოიძებნა');
    }

    const name =
      input.name !== undefined ? input.name.trim() : existing.name;
    if (!name) {
      throw new BadRequestException('დამატების სახელი სავალდებულოა');
    }

    let price = existing.price;
    if (input.price !== undefined) {
      price = Number(input.price);
      if (!Number.isFinite(price) || price < 0) {
        throw new BadRequestException('ფასი არასწორია');
      }
    }

    const addon = await this.prisma.productAddon.update({
      where: { id },
      data: {
        name,
        price,
        ...(input.category !== undefined
          ? { category: parseAddonCategory(input.category) }
          : {}),
      },
    });
    return { addon };
  }

  async deleteRestaurantAddon(id: string) {
    const existing = await this.prisma.productAddon.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('დამატება ვერ მოიძებნა');
    }

    await this.prisma.productAddon.delete({ where: { id } });
    return { ok: true };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('შეკვეთა ვერ მოიძებნა');

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === 'CANCELLED' ? { paymentStatus: 'FAILED' } : {}),
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

    return { order: updated };
  }

  async getCouriers() {
    const users = await this.prisma.user.findMany({
      where: { role: 'COURIER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        isActive: true,
        courier: {
          select: {
            id: true,
            vehicleType: true,
            isOnline: true,
            rating: true,
          },
        },
      },
    });

    return {
      couriers: users.map((user) => ({
        id: user.courier?.id ?? user.id,
        userId: user.id,
        vehicleType: user.courier?.vehicleType ?? 'BICYCLE',
        isOnline: user.courier?.isOnline ?? false,
        rating: user.courier?.rating ?? null,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          email: user.email,
          isActive: user.isActive,
        },
      })),
    };
  }

  async getRestaurants() {
    const restaurants = await this.prisma.restaurant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            personalId: true,
          },
        },
        categories: {
          include: { category: { select: { name: true } } },
        },
        _count: { select: { products: true, orders: true } },
      },
    });
    return { restaurants };
  }

  async getRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            personalId: true,
          },
        },
        categories: {
          include: { category: { select: { name: true } } },
        },
        workingHours: { orderBy: { day: 'asc' } },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        _count: { select: { products: true, orders: true } },
      },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }
    return { restaurant };
  }

  async createRestaurant(body: Record<string, unknown>) {
    const ownerId = String(body.ownerId ?? '').trim();
    const name = String(body.name ?? '').trim();
    const slug = String(body.slug ?? '').trim();
    const city = String(body.city ?? '').trim();
    const street = String(body.street ?? '').trim();
    const emailRaw = String(body.email ?? '').trim();
    const email = emailRaw || null;
    const categories = Array.isArray(body.categories)
      ? body.categories.map((c) => String(c).trim()).filter(Boolean)
      : [];

    if (!ownerId || !name || !slug || !city || !street) {
      throw new BadRequestException('ownerId, name, slug, city და street სავალდებულოა');
    }
    if (categories.length === 0) {
      throw new BadRequestException('აირჩიეთ მინიმუმ ერთი კატეგორია');
    }

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('მფლობელი არ მოიძებნა');
    }

    const phone = String(body.phone ?? '').trim() || owner.phone;
    if (phone.replace(/\s/g, '').length < 9) {
      throw new BadRequestException('ტელეფონი სავალდებულოა');
    }

    const slugTaken = await this.prisma.restaurant.findUnique({ where: { slug } });
    if (slugTaken) {
      throw new ConflictException('slug უკვე გამოყენებულია');
    }

    const personalId = this.normalizePersonalId(body.ownerPersonalId);
    await this.assertPersonalIdAvailable(personalId, ownerId);

    if (email) {
      const emailTaken = await this.prisma.restaurant.findUnique({ where: { email } });
      if (emailTaken) {
        throw new ConflictException('email უკვე გამოყენებულია');
      }
    }

    const addressParts = [
      street,
      String(body.building ?? '').trim(),
      String(body.floor ?? '').trim()
        ? `სართ. ${String(body.floor ?? '').trim()}`
        : '',
      String(body.apartment ?? '').trim()
        ? `ბ. ${String(body.apartment ?? '').trim()}`
        : '',
      String(body.postalCode ?? '').trim(),
    ].filter(Boolean);

    const latitude = this.parseOptionalFloat(body.latitude);
    const longitude = this.parseOptionalFloat(body.longitude);
    const deliveryFee = this.parseOptionalFloat(body.deliveryFee);
    const deliveryFeePerKm = this.parseOptionalFloat(body.deliveryFeePerKm);
    const minimumOrder = this.parseOptionalFloat(body.minimumOrder);
    const deliveryRadius = this.parseOptionalFloat(body.deliveryRadius);
    const isOpen =
      typeof body.acceptingOrders === 'boolean' ? body.acceptingOrders : true;
    const isApproved =
      typeof body.approved === 'boolean' ? body.approved : false;

    const workingHours = Array.isArray(body.workingHours)
      ? body.workingHours
      : [];
    const dayIndex: Record<string, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    };

    const restaurant = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: ownerId },
        data: {
          personalId,
          ...(owner.role === 'USER' ? { role: 'RESTAURANT_OWNER' } : {}),
        },
      });

      const categoryIds: string[] = [];
      for (const categoryName of categories) {
        const existing = await tx.restaurantCategory.findFirst({
          where: { name: categoryName },
        });
        const category =
          existing ??
          (await tx.restaurantCategory.create({
            data: { name: categoryName },
          }));
        categoryIds.push(category.id);
      }

      const created = await tx.restaurant.create({
        data: {
          ownerId,
          name,
          slug,
          description: String(body.description ?? '').trim() || null,
          logo: (body.logo as string | null) ?? null,
          coverImage: (body.coverImage as string | null) ?? null,
          phone,
          email,
          city,
          address: addressParts.join(', '),
          latitude,
          longitude,
          deliveryRadius,
          minimumOrder,
          deliveryFee,
          deliveryFeePerKm,
          isOpen,
          isApproved,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          workingHours: {
            create: workingHours
              .map((row) => {
                const day = String((row as { day?: string }).day ?? '');
                const idx = dayIndex[day];
                if (idx === undefined) return null;
                return {
                  day: idx,
                  openTime: String((row as { openTime?: string }).openTime ?? '10:00'),
                  closeTime: String((row as { closeTime?: string }).closeTime ?? '22:00'),
                  isClosed: Boolean((row as { isClosed?: boolean }).isClosed),
                };
              })
              .filter((row): row is NonNullable<typeof row> => row !== null),
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              personalId: true,
            },
          },
          categories: {
            include: { category: { select: { name: true } } },
          },
          _count: { select: { products: true, orders: true } },
        },
      });

      return created;
    });

    await ensureStandardMenuCategories(this.prisma, restaurant.id);

    return { restaurant };
  }

  private parseOptionalFloat(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  private normalizePersonalId(value: unknown): string {
    const personalId = String(value ?? '').trim();
    if (!/^\d{11}$/.test(personalId)) {
      throw new BadRequestException('პირადობის ნომერი უნდა იყოს 11 ციფრი');
    }
    return personalId;
  }

  private async assertPersonalIdAvailable(personalId: string, userId: string) {
    const taken = await this.prisma.user.findFirst({
      where: { personalId, NOT: { id: userId } },
    });
    if (taken) {
      throw new ConflictException('პირადობის ნომერი უკვე გამოყენებულია');
    }
  }

  async patchRestaurant(
    id: string,
    data: { isApproved?: boolean; isOpen?: boolean },
  ) {
    await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...(typeof data.isApproved === 'boolean'
          ? { isApproved: data.isApproved }
          : {}),
        ...(typeof data.isOpen === 'boolean' ? { isOpen: data.isOpen } : {}),
      },
    });
    return this.getRestaurant(id);
  }

  async updateRestaurant(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    const ownerId = String(body.ownerId ?? '').trim();
    const name = String(body.name ?? '').trim();
    const slug = String(body.slug ?? '').trim();
    const city = String(body.city ?? '').trim();
    const street = String(body.street ?? '').trim();
    const emailRaw = String(body.email ?? '').trim();
    const email = emailRaw || null;
    const categories = Array.isArray(body.categories)
      ? body.categories.map((c) => String(c).trim()).filter(Boolean)
      : [];

    if (!ownerId || !name || !slug || !city || !street) {
      throw new BadRequestException('ownerId, name, slug, city და street სავალდებულოა');
    }
    if (categories.length === 0) {
      throw new BadRequestException('აირჩიეთ მინიმუმ ერთი კატეგორია');
    }

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!owner) {
      throw new NotFoundException('მფლობელი არ მოიძებნა');
    }

    const phone = String(body.phone ?? '').trim() || owner.phone;
    if (phone.replace(/\s/g, '').length < 9) {
      throw new BadRequestException('ტელეფონი სავალდებულოა');
    }

    const slugTaken = await this.prisma.restaurant.findFirst({
      where: { slug, NOT: { id } },
    });
    if (slugTaken) {
      throw new ConflictException('slug უკვე გამოყენებულია');
    }

    const personalId = this.normalizePersonalId(body.ownerPersonalId);
    await this.assertPersonalIdAvailable(personalId, ownerId);

    if (email) {
      const emailTaken = await this.prisma.restaurant.findFirst({
        where: { email, NOT: { id } },
      });
      if (emailTaken) {
        throw new ConflictException('email უკვე გამოყენებულია');
      }
    }

    const addressParts = [
      street,
      String(body.building ?? '').trim(),
      String(body.floor ?? '').trim()
        ? `სართ. ${String(body.floor ?? '').trim()}`
        : '',
      String(body.apartment ?? '').trim()
        ? `ბ. ${String(body.apartment ?? '').trim()}`
        : '',
      String(body.postalCode ?? '').trim(),
    ].filter(Boolean);

    const latitude = this.parseOptionalFloat(body.latitude);
    const longitude = this.parseOptionalFloat(body.longitude);
    const deliveryFee = this.parseOptionalFloat(body.deliveryFee);
    const deliveryFeePerKm = this.parseOptionalFloat(body.deliveryFeePerKm);
    const minimumOrder = this.parseOptionalFloat(body.minimumOrder);
    const deliveryRadius = this.parseOptionalFloat(body.deliveryRadius);
    const isOpen =
      typeof body.acceptingOrders === 'boolean' ? body.acceptingOrders : true;
    const isApproved =
      typeof body.approved === 'boolean' ? body.approved : existing.isApproved;

    const workingHours = Array.isArray(body.workingHours)
      ? body.workingHours
      : [];
    const dayIndex: Record<string, number> = {
      monday: 0,
      tuesday: 1,
      wednesday: 2,
      thursday: 3,
      friday: 4,
      saturday: 5,
      sunday: 6,
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: ownerId },
        data: {
          personalId,
          ...(owner.role === 'USER' ? { role: 'RESTAURANT_OWNER' } : {}),
        },
      });

      const categoryIds: string[] = [];
      for (const categoryName of categories) {
        const found = await tx.restaurantCategory.findFirst({
          where: { name: categoryName },
        });
        const category =
          found ??
          (await tx.restaurantCategory.create({
            data: { name: categoryName },
          }));
        categoryIds.push(category.id);
      }

      await tx.restaurantCategoryRelation.deleteMany({
        where: { restaurantId: id },
      });
      await tx.workingHour.deleteMany({ where: { restaurantId: id } });

      await tx.restaurant.update({
        where: { id },
        data: {
          ownerId,
          name,
          slug,
          description: String(body.description ?? '').trim() || null,
          logo: (body.logo as string | null) ?? null,
          coverImage: (body.coverImage as string | null) ?? null,
          phone,
          email,
          city,
          address: addressParts.join(', '),
          latitude,
          longitude,
          deliveryRadius,
          minimumOrder,
          deliveryFee,
          deliveryFeePerKm,
          isOpen,
          isApproved,
          categories: {
            create: categoryIds.map((categoryId) => ({ categoryId })),
          },
          workingHours: {
            create: workingHours
              .map((row) => {
                const day = String((row as { day?: string }).day ?? '');
                const idx = dayIndex[day];
                if (idx === undefined) return null;
                return {
                  day: idx,
                  openTime: String(
                    (row as { openTime?: string }).openTime ?? '10:00',
                  ),
                  closeTime: String(
                    (row as { closeTime?: string }).closeTime ?? '22:00',
                  ),
                  isClosed: Boolean(
                    (row as { isClosed?: boolean }).isClosed,
                  ),
                };
              })
              .filter((row): row is NonNullable<typeof row> => row !== null),
          },
        },
      });
    });

    return this.getRestaurant(id);
  }

  async deleteRestaurant(id: string) {
    const existing = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });
    if (!existing) {
      throw new NotFoundException('რესტორანი არ მოიძებნა');
    }

    if (existing._count.orders > 0) {
      throw new BadRequestException(
        'რესტორნს აქვს შეკვეთები — წაშლა შეუძლებელია',
      );
    }

    await this.prisma.$transaction([
      this.prisma.cart.deleteMany({ where: { restaurantId: id } }),
      this.prisma.restaurant.delete({ where: { id } }),
    ]);

    return { deleted: true };
  }

  // ─── Users ───────────────────────────────────────────────────

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        personalId: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return { users };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            city: true,
            street: true,
            building: true,
            isDefault: true,
          },
        },
        restaurants: {
          select: {
            id: true,
            name: true,
            city: true,
            isApproved: true,
            isOpen: true,
          },
        },
        courier: {
          select: {
            id: true,
            vehicleType: true,
            isOnline: true,
            rating: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
            restaurant: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            orders: true,
            deliveries: true,
            restaurants: true,
            reviews: true,
            addresses: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('მომხმარებელი არ მოიძებნა');
    return { user };
  }

  async createUser(body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: Role;
    isActive?: boolean;
  }) {
    const firstName = body.firstName?.trim() ?? '';
    const lastName = body.lastName?.trim() ?? '';
    const email = body.email?.trim().toLowerCase() ?? '';
    const phone = body.phone?.trim() ?? '';
    const password = body.password ?? '';
    const role = body.role ?? 'USER';
    const isActive = body.isActive ?? true;

    if (!firstName || !lastName || !email || !phone || !password) {
      throw new BadRequestException('ყველა ველი სავალდებულოა');
    }
    if (!ROLES.includes(role)) {
      throw new BadRequestException('არასწორი როლი');
    }
    if (password.length < 6) {
      throw new BadRequestException('პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });
    if (existing) {
      throw new ConflictException('ელფოსტა ან ტელეფონი უკვე გამოყენებულია');
    }

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        password: await hash(password, 12),
        role,
        isActive,
        ...(role === 'COURIER'
          ? { courier: { create: { vehicleType: 'BICYCLE' } } }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return { user };
  }

  private async syncCourierProfile(userId: string, role: Role) {
    if (role === 'COURIER') {
      await this.prisma.courier.upsert({
        where: { userId },
        update: {},
        create: { userId, vehicleType: 'BICYCLE' },
      });
    }
  }

  async updateUser(
    adminId: string,
    id: string,
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: Role;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('მომხმარებელი არ მოიძებნა');

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const password = body.password;
    const role = body.role;
    const isActive = body.isActive;

    if (role && !ROLES.includes(role)) {
      throw new BadRequestException('არასწორი როლი');
    }
    if (
      id === adminId &&
      ((role && role !== 'ADMIN') || isActive === false)
    ) {
      throw new BadRequestException(
        'საკუთარი ადმინ ანგარიშის შეცვლა/გათიშვა შეუძლებელია',
      );
    }
    if (password && password.length < 6) {
      throw new BadRequestException('პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო');
    }

    if (email || phone) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(email ? [{ email }] : []),
            ...(phone ? [{ phone }] : []),
          ],
        },
      });
      if (conflict) {
        throw new ConflictException('ელფოსტა ან ტელეფონი უკვე გამოყენებულია');
      }
    }

    const nextRole = role ?? existing.role;
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(role ? { role } : {}),
        ...(password ? { password: await hash(password, 12) } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });

    await this.syncCourierProfile(id, nextRole as Role);
    return { user };
  }

  async deleteUser(adminId: string, id: string) {
    if (id === adminId) {
      throw new BadRequestException('საკუთარი ანგარიშის წაშლა შეუძლებელია');
    }

    const existing = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orders: true,
            restaurants: true,
            deliveries: true,
            reviews: true,
          },
        },
      },
    });
    if (!existing) throw new NotFoundException('მომხმარებელი არ მოიძებნა');

    const blocked =
      existing._count.orders > 0 ||
      existing._count.restaurants > 0 ||
      existing._count.deliveries > 0 ||
      existing._count.reviews > 0;

    if (blocked) {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        softDeleted: true,
        message: 'მომხმარებელს აქვს ჩანაწერები, ამიტომ გათიშულია',
      };
    }

    await this.prisma.user.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Settings ────────────────────────────────────────────────

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');
    return { user };
  }

  async updateSettings(
    userId: string,
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      birthDate?: string | null;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!existing) throw new NotFoundException('მომხმარებელი ვერ მოიძებნა');

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.trim();
    const newPassword = body.newPassword?.trim();
    const currentPassword = body.currentPassword?.trim();

    if (!firstName || !lastName || !email || !phone) {
      throw new BadRequestException(
        'სახელი, გვარი, ელფოსტა და ტელეფონი სავალდებულოა',
      );
    }

    if (email !== existing.email) {
      const taken = await this.prisma.user.findUnique({ where: { email } });
      if (taken) throw new ConflictException('ეს ელფოსტა უკვე გამოყენებულია');
    }
    if (phone !== existing.phone) {
      const taken = await this.prisma.user.findUnique({ where: { phone } });
      if (taken) throw new ConflictException('ეს ტელეფონი უკვე გამოყენებულია');
    }

    if (newPassword) {
      if (!currentPassword) {
        throw new BadRequestException(
          'პაროლის შესაცვლელად შეიყვანე მიმდინარე პაროლი',
        );
      }
      if (newPassword.length < 6) {
        throw new BadRequestException(
          'ახალი პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო',
        );
      }
      const valid = await compare(currentPassword, existing.password);
      if (!valid) {
        throw new BadRequestException('მიმდინარე პაროლი არასწორია');
      }
    }

    let birthDate: Date | null | undefined = undefined;
    if (body.birthDate !== undefined) {
      if (!body.birthDate) {
        birthDate = null;
      } else {
        const parsed = new Date(body.birthDate);
        if (Number.isNaN(parsed.getTime())) {
          throw new BadRequestException('დაბადების თარიღი არასწორია');
        }
        birthDate = parsed;
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phone,
        ...(birthDate !== undefined ? { birthDate } : {}),
        ...(newPassword ? { password: await hash(newPassword, 12) } : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        birthDate: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    return { user, passwordChanged: Boolean(newPassword) };
  }

  // ─── Coupons ─────────────────────────────────────────────────

  private generateCode() {
    const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `YMX-${part()}-${part()}`;
  }

  async getCoupons() {
    const [coupons, users] = await Promise.all([
      this.prisma.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: { select: { usages: true } },
        },
      }),
      this.prisma.user.findMany({
        where: { isActive: true },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
        },
      }),
    ]);
    return { coupons, users };
  }

  async createCoupon(
    adminId: string,
    body: {
      code?: string;
      value?: number;
      assignedToId?: string;
      expiresAt?: string | null;
      minimumOrder?: number | null;
      note?: string;
    },
  ) {
    const value = Number(body.value);
    if (!value || value <= 0) {
      throw new BadRequestException('თანხა უნდა იყოს 0-ზე მეტი');
    }
    if (!body.assignedToId) {
      throw new BadRequestException('აირჩიე თანამშრომელი');
    }

    const assignee = await this.prisma.user.findUnique({
      where: { id: body.assignedToId },
    });
    if (!assignee || !assignee.isActive) {
      throw new NotFoundException('თანამშრომელი ვერ მოიძებნა');
    }

    const code = (body.code?.trim() || this.generateCode()).toUpperCase();
    const existing = await this.prisma.coupon.findUnique({ where: { code } });
    if (existing) throw new ConflictException('ეს კოდი უკვე არსებობს');

    const coupon = await this.prisma.coupon.create({
      data: {
        code,
        type: 'BALANCE',
        value,
        remainingBalance: value,
        assignedToId: body.assignedToId,
        createdById: adminId,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        minimumOrder:
          body.minimumOrder != null && body.minimumOrder > 0
            ? body.minimumOrder
            : null,
        note: body.note?.trim() || null,
        isActive: true,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return { coupon };
  }

  async updateCoupon(
    id: string,
    body: {
      assignedToId?: string | null;
      expiresAt?: string | null;
      isActive?: boolean;
      note?: string | null;
      topUp?: number;
    },
  ) {
    const existing = await this.prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('კუპონი არ მოიძებნა');

    if (body.assignedToId) {
      const user = await this.prisma.user.findUnique({
        where: { id: body.assignedToId },
      });
      if (!user || !user.isActive) {
        throw new NotFoundException('თანამშრომელი ვერ მოიძებნა');
      }
    }

    let remainingBalance = existing.remainingBalance;
    let value = existing.value;
    if (body.topUp != null && body.topUp > 0) {
      remainingBalance =
        Math.round((remainingBalance + body.topUp) * 100) / 100;
      value = Math.round((value + body.topUp) * 100) / 100;
    }

    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(body.assignedToId !== undefined
          ? { assignedToId: body.assignedToId }
          : {}),
        ...(body.expiresAt !== undefined
          ? { expiresAt: body.expiresAt ? new Date(body.expiresAt) : null }
          : {}),
        ...(typeof body.isActive === 'boolean'
          ? { isActive: body.isActive }
          : {}),
        ...(body.note !== undefined ? { note: body.note } : {}),
        remainingBalance,
        value,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    return { coupon };
  }

  async deactivateCoupon(id: string) {
    await this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });
    return { deactivated: true };
  }

  // ─── Product Categories (menu sections) ──────────────────────

  async listProductCategories(restaurantId?: string) {
    if (restaurantId) {
      await ensureStandardMenuCategories(this.prisma, restaurantId);
    } else {
      await ensureAllRestaurantMenuCategories(this.prisma);
    }
    const categories = await this.prisma.productCategory.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      select: {
        id: true,
        restaurantId: true,
        name: true,
        sortOrder: true,
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
      orderBy: [{ restaurantId: 'asc' }, { sortOrder: 'asc' }],
    });
    return {
      categories: onlyStandardMenuCategories(categories),
    };
  }



  async createProductCategory(_input: ProductCategoryWriteInput) {
    throw new BadRequestException('კატეგორიების ხელით დამატება არ შეიძლება');
  }

  async updateProductCategory(
    id: string,
    input: Partial<ProductCategoryWriteInput>,
  ) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('კატეგორია ვერ მოიძებნა');
    }

    const category = await this.prisma.productCategory.update({
      where: { id },
      data: {
        ...(input.name != null ? { name: input.name.trim() } : {}),
        ...(input.sortOrder != null ? { sortOrder: input.sortOrder } : {}),
      },
    });

    return { category };
  }

  async deleteProductCategory(id: string) {
    const existing = await this.prisma.productCategory.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!existing) {
      throw new NotFoundException('კატეგორია ვერ მოიძებნა');
    }
    if (isStandardMenuCategory(existing.name)) {
      throw new BadRequestException('სტანდარტული კატეგორია არ იშლება');
    }
    if (existing._count.products > 0) {
      throw new BadRequestException(
        'კატეგორიაში პროდუქტებია — ჯერ წაშალე ან გადაიტანე ისინი',
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });
    return { ok: true };
  }

  async getRestaurantMenu(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true, name: true, slug: true, isApproved: true },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    await ensureStandardMenuCategories(this.prisma, restaurantId);

    const categories = await this.prisma.productCategory.findMany({
      where: { restaurantId },
      orderBy: { sortOrder: 'asc' },
      include: {
        products: {
          where: { deletedAt: null },
          orderBy: { name: 'asc' },
          include: productInclude,
        },
      },
    });

    return {
      restaurant,
      menu: onlyStandardMenuCategories(categories).map((category) => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        products: category.products.map((product) => this.mapProduct(product)),
      })),
    };
  }

  // ─── Products ────────────────────────────────────────────────

  private parseAllergens(value: unknown) {
    if (!value || typeof value !== 'object') return { ...DEFAULT_ALLERGENS };
    const o = value as Record<string, unknown>;
    return {
      gluten: Boolean(o.gluten),
      milk: Boolean(o.milk),
      eggs: Boolean(o.eggs),
      fish: Boolean(o.fish),
      nuts: Boolean(o.nuts),
      soy: Boolean(o.soy),
      vegan: Boolean(o.vegan),
      vegetarian: Boolean(o.vegetarian),
    };
  }

  private availabilityToDbFields(availability: ProductAvailability) {
    switch (availability) {
      case 'AVAILABLE':
        return { isAvailable: true, isHidden: false, outOfStock: false };
      case 'UNAVAILABLE':
        return { isAvailable: false, isHidden: false, outOfStock: false };
      case 'HIDDEN':
        return { isAvailable: false, isHidden: true, outOfStock: false };
      case 'OUT_OF_STOCK':
        return { isAvailable: false, isHidden: false, outOfStock: true };
    }
  }

  private isAvailableToAvailability(
    isAvailable: boolean,
    isHidden: boolean,
    outOfStock: boolean,
  ): ProductAvailability {
    if (outOfStock) return 'OUT_OF_STOCK';
    if (isHidden) return 'HIDDEN';
    if (isAvailable) return 'AVAILABLE';
    return 'UNAVAILABLE';
  }

  private mapProduct(row: DbProduct) {
    return {
      id: row.id,
      restaurantId: row.restaurantId,
      categoryId: row.categoryId,
      name: row.name,
      description: row.description,
      image: row.image,
      gallery: row.gallery ?? [],
      price: row.price,
      discountPrice: row.discountPrice,
      calories: row.calories,
      preparationTime: row.preparationTime,
      weight: row.weight,
      foodType: row.foodType,
      spicinessLevel: row.spicinessLevel,
      availability: this.isAvailableToAvailability(
        row.isAvailable,
        row.isHidden,
        row.outOfStock,
      ),
      isAvailable: row.isAvailable,
      allergens: this.parseAllergens(row.allergens),
      variants: sortVariantsBySize(
        row.variants.map((v) => ({
          id: v.id,
          name: v.name,
          price: v.price,
        })),
      ),
      customizationGroups: row.customizationGroups.map((group) => ({
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
      addOns: [] as { id: string; name: string; price: number }[],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async assertCategoryBelongsToRestaurant(
    categoryId: string,
    restaurantId: string,
  ) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: categoryId, restaurantId },
    });
    if (!category) {
      throw new BadRequestException(
        'კატეგორია არ ეკუთვნის არჩეულ რესტორანს — აირჩიე სწორი კატეგორია',
      );
    }
    return category;
  }

  private async assertComboProductRules(input: ProductWriteInput) {
    const category = await this.prisma.productCategory.findFirst({
      where: { id: input.categoryId },
      select: { name: true },
    });
    assertComboProductRules({
      foodType: input.foodType,
      categoryName: category?.name ?? null,
      variants: input.variants,
      customizationGroups: input.customizationGroups,
    });
  }

  private buildProductData(input: ProductWriteInput) {
    const status = this.availabilityToDbFields(input.availability);
    return {
      restaurantId: input.restaurantId,
      categoryId: input.categoryId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      image: input.image || null,
      gallery: input.gallery ?? [],
      price: input.price,
      discountPrice: input.discountPrice,
      calories: input.calories,
      preparationTime: input.preparationTime,
      weight: input.weight,
      foodType: input.foodType || null,
      spicinessLevel: input.spicinessLevel || null,
      allergens: (input.allergens ?? DEFAULT_ALLERGENS) as Prisma.InputJsonValue,
      ...status,
    };
  }

  private buildCustomizationGroupsCreate(input: ProductWriteInput) {
    return sanitizeCustomizationGroups(input.customizationGroups).map(
      (group) => ({
        name: group.name,
        description: group.description,
        kind: group.kind ?? 'option',
        required: group.required ?? false,
        minSelections: group.minSelections ?? 0,
        maxSelections: group.maxSelections ?? 1,
        sortOrder: group.sortOrder ?? 0,
        options: {
          create: group.options.map((option) => ({
            name: option.name,
            price: option.price,
            sortOrder: option.sortOrder ?? 0,
            isAvailable: option.isAvailable !== false,
          })),
        },
      }),
    );
  }

  async listProducts() {
    await ensureAllRestaurantMenuCategories(this.prisma);
    const [products, restaurants, categories] = await Promise.all([
      this.prisma.product.findMany({
        where: { deletedAt: null },
        include: productInclude,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.findMany({
        select: { id: true, name: true, slug: true, isApproved: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.productCategory.findMany({
        select: {
          id: true,
          restaurantId: true,
          name: true,
          sortOrder: true,
        },
        orderBy: [{ restaurantId: 'asc' }, { sortOrder: 'asc' }],
      }),
    ]);
    return {
      products: products.map((p) => this.mapProduct(p)),
      restaurants,
      categories: onlyStandardMenuCategories(categories),
    };
  }

  async getProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: productInclude,
    });
    if (!product) throw new NotFoundException('პროდუქტი არ მოიძებნა');
    return { product: this.mapProduct(product) };
  }

  async createProduct(input: ProductWriteInput) {
    await ensureStandardMenuCategories(this.prisma, input.restaurantId);
    await this.assertCategoryBelongsToRestaurant(
      input.categoryId,
      input.restaurantId,
    );
    await this.assertComboProductRules(input);

    const product = await this.prisma.product.create({
      data: {
        ...this.buildProductData(input),
        variants: {
          create: sanitizeProductVariants(input.variants).map((v) => ({
            name: v.name,
            price: v.price,
          })),
        },
        customizationGroups: {
          create: this.buildCustomizationGroupsCreate(input),
        },
      },
      include: productInclude,
    });
    return { product: this.mapProduct(product) };
  }

  async updateProduct(id: string, input: ProductWriteInput) {
    await ensureStandardMenuCategories(this.prisma, input.restaurantId);
    await this.assertCategoryBelongsToRestaurant(
      input.categoryId,
      input.restaurantId,
    );
    await this.assertComboProductRules(input);

    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.productCustomizationGroup.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...this.buildProductData(input),
          variants: {
            create: sanitizeProductVariants(input.variants).map((v) => ({
              name: v.name,
              price: v.price,
            })),
          },
          customizationGroups: {
            create: this.buildCustomizationGroupsCreate(input),
          },
        },
        include: productInclude,
      });
    });
    return { product: this.mapProduct(product) };
  }

  async patchAvailability(id: string, availability: ProductAvailability) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('პროდუქტი არ მოიძებნა');
    const product = await this.prisma.product.update({
      where: { id },
      data: this.availabilityToDbFields(availability),
      include: productInclude,
    });
    return { product: this.mapProduct(product) };
  }

  async deleteProduct(id: string) {
    const existing = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: { select: { id: true } },
        customizationGroups: {
          select: { options: { select: { id: true } } },
        },
      },
    });
    if (!existing) throw new NotFoundException('პროდუქტი არ მოიძებნა');
    if (existing.deletedAt) return { deleted: true };

    const variantIds = existing.variants.map((variant) => variant.id);
    const optionIds = existing.customizationGroups.flatMap((group) =>
      group.options.map((option) => option.id),
    );

    await this.prisma.$transaction(async (tx) => {
      if (optionIds.length > 0) {
        await tx.cartItemCustomization.deleteMany({
          where: { optionId: { in: optionIds } },
        });
      }
      await tx.cartItem.deleteMany({
        where: {
          OR: [
            { productId: id },
            ...(variantIds.length ? [{ variantId: { in: variantIds } }] : []),
          ],
        },
      });
      await tx.favoriteProduct.deleteMany({ where: { productId: id } });

      const [orderItems, orderVariants, orderOptions] = await Promise.all([
        tx.orderItem.count({ where: { productId: id } }),
        variantIds.length
          ? tx.orderItem.count({ where: { variantId: { in: variantIds } } })
          : Promise.resolve(0),
        optionIds.length
          ? tx.orderItemCustomization.count({
              where: { optionId: { in: optionIds } },
            })
          : Promise.resolve(0),
      ]);

      if (orderItems + orderVariants + orderOptions > 0) {
        await tx.product.update({
          where: { id },
          data: {
            deletedAt: new Date(),
            isHidden: true,
            isAvailable: false,
          },
        });
        return;
      }

      await tx.product.delete({ where: { id } });
    });

    return { deleted: true };
  }

  async duplicateProduct(id: string) {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        customizationGroups: { include: { options: true } },
      },
    });
    if (!source) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    const product = await this.prisma.product.create({
      data: {
        restaurantId: source.restaurantId,
        categoryId: source.categoryId,
        name: `${source.name} (კოპია)`,
        description: source.description,
        image: source.image,
        gallery: source.gallery,
        price: source.price,
        discountPrice: source.discountPrice,
        calories: source.calories,
        preparationTime: source.preparationTime,
        weight: source.weight,
        foodType: source.foodType,
        spicinessLevel: source.spicinessLevel,
        allergens: source.allergens ?? undefined,
        isAvailable: source.isAvailable,
        isHidden: source.isHidden,
        outOfStock: source.outOfStock,
        variants: {
          create: source.variants.map((v) => ({
            name: v.name,
            price: v.price,
          })),
        },
        customizationGroups: {
          create: source.customizationGroups.map((group) => ({
            name: group.name,
            description: group.description,
            kind: group.kind === 'exclusion' ? 'exclusion' : 'option',
            required: group.required,
            minSelections: group.minSelections,
            maxSelections: group.maxSelections,
            sortOrder: group.sortOrder,
            options: {
              create: group.options.map((option) => ({
                name: option.name,
                price: option.price,
                sortOrder: option.sortOrder,
                isAvailable: option.isAvailable,
              })),
            },
          })),
        },
      },
      include: productInclude,
    });
    return { product: this.mapProduct(product) };
  }

  async listFavoriteFoods() {
    const items = await this.prisma.homeFavoriteFood.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        product: {
          include: {
            restaurant: { select: { id: true, name: true, slug: true } },
            category: { select: { name: true } },
          },
        },
      },
    });
    return {
      items: items
        .filter((row) => row.product != null)
        .map((row) => this.mapFavoriteFood(row)),
    };
  }

  private mapFavoriteFood(row: {
    id: string;
    productId: string;
    sortOrder: number;
    isActive: boolean;
    product: {
      id: string;
      name: string;
      image: string | null;
      price: number;
      discountPrice: number | null;
      restaurant: { id: string; name: string; slug: string };
      category: { name: string };
    };
  }) {
    return {
      id: row.id,
      productId: row.productId,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      product: {
        id: row.product.id,
        name: row.product.name,
        image: row.product.image,
        price: row.product.price,
        discountPrice: row.product.discountPrice,
        restaurantId: row.product.restaurant.id,
        restaurantName: row.product.restaurant.name,
        restaurantSlug: row.product.restaurant.slug,
        categoryName: row.product.category.name,
      },
    };
  }

  async createFavoriteFood(body: {
    productId: string;
    isActive?: boolean;
  }) {
    const productId = body.productId.trim();
    const product = await this.prisma.product.findFirst({
      where: { id: productId, deletedAt: null },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundException('პროდუქტი არ მოიძებნა');
    }

    const existing = await this.prisma.homeFavoriteFood.findUnique({
      where: { productId },
    });
    if (existing) {
      throw new ConflictException('ეს საჭმელი უკვე დამატებულია');
    }

    const max = await this.prisma.homeFavoriteFood.aggregate({
      _max: { sortOrder: true },
    });

    const item = await this.prisma.homeFavoriteFood.create({
      data: {
        productId,
        isActive: body.isActive ?? true,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
      },
      include: {
        product: {
          include: {
            restaurant: { select: { id: true, name: true, slug: true } },
            category: { select: { name: true } },
          },
        },
      },
    });
    return { item: this.mapFavoriteFood(item) };
  }

  async updateFavoriteFood(
    id: string,
    body: {
      productId?: string;
      isActive?: boolean;
    },
  ) {
    const current = await this.prisma.homeFavoriteFood.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('ჩანაწერი ვერ მოიძებნა');

    if (body.productId && body.productId.trim() !== current.productId) {
      const productId = body.productId.trim();
      const product = await this.prisma.product.findFirst({
        where: { id: productId, deletedAt: null },
        select: { id: true },
      });
      if (!product) {
        throw new NotFoundException('პროდუქტი არ მოიძებნა');
      }

      const clash = await this.prisma.homeFavoriteFood.findUnique({
        where: { productId },
      });
      if (clash && clash.id !== id) {
        throw new ConflictException('ეს საჭმელი უკვე დამატებულია');
      }
    }

    const item = await this.prisma.homeFavoriteFood.update({
      where: { id },
      data: {
        ...(body.productId != null ? { productId: body.productId.trim() } : {}),
        ...(body.isActive != null ? { isActive: body.isActive } : {}),
      },
      include: {
        product: {
          include: {
            restaurant: { select: { id: true, name: true, slug: true } },
            category: { select: { name: true } },
          },
        },
      },
    });
    return { item: this.mapFavoriteFood(item) };
  }

  async deleteFavoriteFood(id: string) {
    const current = await this.prisma.homeFavoriteFood.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('ჩანაწერი ვერ მოიძებნა');
    await this.prisma.homeFavoriteFood.delete({ where: { id } });
    return { ok: true };
  }

  async reorderFavoriteFoods(ids: string[]) {
    const existing = await this.prisma.homeFavoriteFood.findMany({
      select: { id: true },
    });
    const existingIds = new Set(existing.map((row) => row.id));
    if (
      ids.length !== existingIds.size ||
      ids.some((id) => !existingIds.has(id))
    ) {
      throw new BadRequestException('რიგის განახლება ვერ მოხერხდა');
    }

    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.homeFavoriteFood.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.listFavoriteFoods();
  }
}
