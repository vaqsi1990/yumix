import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

jest.mock('../admin/admin.service', () => ({
  AdminService: class AdminService {},
}));

import { RestaurantPanelService } from './restaurant.service';

function createService() {
  const prisma = {
    restaurant: {
      findFirst: jest.fn(),
    },
    coupon: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  const admin = {} as never;
  const service = new RestaurantPanelService(prisma as never, admin);
  return { service, prisma };
}

const restaurant = { id: 'rest-a', name: 'Pizza Place' };
const couponRow = {
  id: 'coupon-1',
  code: 'PIZZA20',
  type: 'PERCENT',
  value: 20,
  remainingBalance: 0,
  minimumOrder: 30,
  startsAt: null,
  expiresAt: new Date('2026-12-31'),
  usageLimit: 100,
  isActive: true,
  note: null,
  restaurantId: 'rest-a',
  assignedToId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  _count: { usages: 0, orders: 0 },
};

describe('RestaurantPanelService coupons', () => {
  it('lists coupons only for owned restaurant', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findMany.mockResolvedValue([couponRow]);

    const result = await service.getCoupons('owner-1', 'RESTAURANT_OWNER');

    expect(prisma.coupon.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { restaurantId: 'rest-a' },
      }),
    );
    expect(result.coupons).toHaveLength(1);
    expect(result.coupons[0].code).toBe('PIZZA20');
  });

  it('cannot access another restaurant coupon by id', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue(null);

    await expect(
      service.updateCoupon('owner-1', 'RESTAURANT_OWNER', 'coupon-x', {
        note: 'test',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates coupon for owned restaurant only', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findUnique.mockResolvedValue(null);
    prisma.coupon.create.mockResolvedValue(couponRow);

    const result = await service.createCoupon('owner-1', 'RESTAURANT_OWNER', {
      code: 'pizza20',
      type: 'PERCENT',
      value: 20,
      minimumOrder: 30,
      usageLimit: 100,
      startsAt: null,
      expiresAt: null,
      isActive: true,
    });

    expect(prisma.coupon.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          code: 'PIZZA20',
          restaurantId: 'rest-a',
          createdById: 'owner-1',
        }),
      }),
    );
    expect(result.coupon.code).toBe('PIZZA20');
  });

  it('rejects duplicate coupon code', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.createCoupon('owner-1', 'RESTAURANT_OWNER', {
        code: 'PIZZA20',
        type: 'PERCENT',
        value: 20,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects invalid percentage on create', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);

    await expect(
      service.createCoupon('owner-1', 'RESTAURANT_OWNER', {
        code: 'BAD',
        type: 'PERCENT',
        value: 150,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates owned coupon', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue(couponRow);
    prisma.coupon.update.mockResolvedValue({
      ...couponRow,
      minimumOrder: 40,
    });

    const result = await service.updateCoupon(
      'owner-1',
      'RESTAURANT_OWNER',
      'coupon-1',
      { minimumOrder: 40 },
    );

    expect(result.coupon.minimumOrder).toBe(40);
  });

  it('blocks editing code after usage', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue({
      ...couponRow,
      _count: { usages: 2, orders: 2 },
    });

    await expect(
      service.updateCoupon('owner-1', 'RESTAURANT_OWNER', 'coupon-1', {
        code: 'NEWCODE',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('toggles coupon status for owned coupon', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue(couponRow);
    prisma.coupon.update.mockResolvedValue({ ...couponRow, isActive: false });

    const result = await service.updateCouponStatus(
      'owner-1',
      'RESTAURANT_OWNER',
      'coupon-1',
      false,
    );

    expect(result.coupon.isActive).toBe(false);
  });

  it('prevents deleting coupon with order history', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue({
      ...couponRow,
      _count: { usages: 1, orders: 1 },
    });

    await expect(
      service.deleteCoupon('owner-1', 'RESTAURANT_OWNER', 'coupon-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes unused owned coupon', async () => {
    const { service, prisma } = createService();
    prisma.restaurant.findFirst.mockResolvedValue(restaurant);
    prisma.coupon.findFirst.mockResolvedValue(couponRow);
    prisma.coupon.delete.mockResolvedValue(couponRow);

    const result = await service.deleteCoupon(
      'owner-1',
      'RESTAURANT_OWNER',
      'coupon-1',
    );

    expect(result.deleted).toBe(true);
    expect(prisma.coupon.delete).toHaveBeenCalledWith({
      where: { id: 'coupon-1' },
    });
  });
});
