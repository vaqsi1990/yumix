import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '../generated/prisma/client';

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
        restaurant: { select: { name: true } },
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
    const minimumOrder = this.parseOptionalFloat(body.minimumOrder);
    const deliveryRadius = this.parseOptionalFloat(body.deliveryRadius);
    const isOpen =
      typeof body.acceptingOrders === 'boolean' ? body.acceptingOrders : true;
    const isApproved = typeof body.approved === 'boolean' ? body.approved : false;

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
      if (owner.role === 'USER') {
        await tx.user.update({
          where: { id: ownerId },
          data: { role: 'RESTAURANT_OWNER' },
        });
      }

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

    return { restaurant };
  }

  private parseOptionalFloat(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  async patchRestaurant(
    id: string,
    data: { isApproved?: boolean; isOpen?: boolean },
  ) {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: {
        ...(typeof data.isApproved === 'boolean'
          ? { isApproved: data.isApproved }
          : {}),
        ...(typeof data.isOpen === 'boolean' ? { isOpen: data.isOpen } : {}),
      },
    });
    return { restaurant };
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
        role: true,
        isActive: true,
        createdAt: true,
        _count: { select: { orders: true } },
      },
    });
    return { users };
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
    const categories = await this.prisma.productCategory.findMany({
      where: restaurantId ? { restaurantId } : undefined,
      select: {
        id: true,
        restaurantId: true,
        name: true,
        sortOrder: true,
        _count: { select: { products: true } },
      },
      orderBy: [{ restaurantId: 'asc' }, { sortOrder: 'asc' }],
    });
    return { categories };
  }



  async createProductCategory(input: ProductCategoryWriteInput) {
    if (!input.restaurantId) {
      throw new BadRequestException('აირჩიე რესტორანი');
    }
    if (!input.name?.trim()) {
      throw new BadRequestException('კატეგორიის სახელი სავალდებულოა');
    }

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
    });
    if (!restaurant) {
      throw new NotFoundException('რესტორანი ვერ მოიძებნა');
    }

    const category = await this.prisma.productCategory.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        sortOrder: input.sortOrder ?? 0,
      },
    });

    return { category };
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
    if (existing._count.products > 0) {
      throw new BadRequestException(
        'კატეგორიაში პროდუქტებია — ჯერ წაშალე ან გადაიტანე ისინი',
      );
    }

    await this.prisma.productCategory.delete({ where: { id } });
    return { ok: true };
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
      variants: row.variants.map((v) => ({
        id: v.id,
        name: v.name,
        price: v.price,
      })),
      addOns: [] as { id: string; name: string; price: number }[],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private validateProductInput(input: Partial<ProductWriteInput>) {
    if (!input.restaurantId) return 'აირჩიე რესტორანი';
    if (!input.categoryId) return 'აირჩიე კატეგორია';
    if (!input.name?.trim()) return 'სახელი სავალდებულოა';
    if (input.price == null || input.price <= 0)
      return 'ფასი უნდა იყოს 0-ზე მეტი';
    if (
      input.discountPrice != null &&
      input.discountPrice > 0 &&
      input.discountPrice >= (input.price ?? 0)
    ) {
      return 'ფასდაკლება უნდა იყოს ძირითად ფასზე ნაკლები';
    }
    return null;
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

  async listProducts() {
    const [products, restaurants, categories] = await Promise.all([
      this.prisma.product.findMany({
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
      categories,
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
    const err = this.validateProductInput(input);
    if (err) throw new BadRequestException(err);
    await this.assertCategoryBelongsToRestaurant(
      input.categoryId,
      input.restaurantId,
    );

    const product = await this.prisma.product.create({
      data: {
        ...this.buildProductData(input),
        variants: {
          create: input.variants
            .filter((v) => v.name.trim())
            .map((v) => ({ name: v.name.trim(), price: v.price })),
        },
      },
      include: productInclude,
    });
    return { product: this.mapProduct(product) };
  }

  async updateProduct(id: string, input: ProductWriteInput) {
    const err = this.validateProductInput(input);
    if (err) throw new BadRequestException(err);
    await this.assertCategoryBelongsToRestaurant(
      input.categoryId,
      input.restaurantId,
    );

    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('პროდუქტი არ მოიძებნა');

    const product = await this.prisma.$transaction(async (tx) => {
      await tx.productVariant.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: {
          ...this.buildProductData(input),
          variants: {
            create: input.variants
              .filter((v) => v.name.trim())
              .map((v) => ({ name: v.name.trim(), price: v.price })),
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
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('პროდუქტი არ მოიძებნა');
    await this.prisma.product.delete({ where: { id } });
    return { deleted: true };
  }

  async duplicateProduct(id: string) {
    const source = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true },
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
      },
      include: productInclude,
    });
    return { product: this.mapProduct(product) };
  }
}
