import {
  computeCouponDiscount,
  isCouponUsableNow,
  normalizeCouponCode,
  resolveCouponStatus,
  restoreCouponInTransaction,
  validateCouponApplicability,
  validateMinimumOrder,
  validateRestaurantCouponValue,
  validateUsageLimit,
} from './coupon.utils';

const baseRestaurantCoupon = {
  type: 'PERCENT',
  value: 20,
  remainingBalance: 0,
  minimumOrder: 30,
  expiresAt: new Date('2026-12-31'),
  startsAt: null,
  isActive: true,
  assignedToId: null,
  restaurantId: 'rest-a',
  usageLimit: 100,
};

describe('coupon.utils', () => {
  it('normalizes coupon codes to uppercase', () => {
    expect(normalizeCouponCode(' pizza20 ')).toBe('PIZZA20');
  });

  it('rejects invalid percentage values', () => {
    expect(validateRestaurantCouponValue('PERCENT', 0)).not.toBeNull();
    expect(validateRestaurantCouponValue('PERCENT', 101)).not.toBeNull();
    expect(validateRestaurantCouponValue('PERCENT', 20)).toBeNull();
  });

  it('rejects invalid fixed discount values', () => {
    expect(validateRestaurantCouponValue('FIXED', 0)).not.toBeNull();
    expect(validateRestaurantCouponValue('FIXED', 5)).toBeNull();
  });

  it('rejects negative minimum order', () => {
    expect(validateMinimumOrder(-1)).not.toBeNull();
    expect(validateMinimumOrder(0)).toBeNull();
  });

  it('rejects invalid usage limits', () => {
    expect(validateUsageLimit(0)).not.toBeNull();
    expect(validateUsageLimit(1.5)).not.toBeNull();
    expect(validateUsageLimit(10)).toBeNull();
  });

  it('computes percent and fixed discounts', () => {
    expect(
      computeCouponDiscount(
        { type: 'PERCENT', value: 20, remainingBalance: 0 },
        100,
      ),
    ).toBe(20);
    expect(
      computeCouponDiscount(
        { type: 'FIXED', value: 5, remainingBalance: 0 },
        100,
      ),
    ).toBe(5);
    expect(
      computeCouponDiscount(
        { type: 'BALANCE', value: 50, remainingBalance: 15 },
        100,
      ),
    ).toBe(15);
  });

  it('marks expired and inactive coupons unusable', () => {
    const expired = validateCouponApplicability(
      {
        ...baseRestaurantCoupon,
        expiresAt: new Date('2020-01-01'),
      },
      {
        userId: 'u1',
        restaurantId: 'rest-a',
        orderTotal: 50,
        usageCount: 0,
        now: new Date('2026-01-01'),
      },
    );
    expect(expired).toBe('კუპონის ვადა ამოწურულია');

    const inactive = validateCouponApplicability(
      { ...baseRestaurantCoupon, isActive: false },
      {
        userId: 'u1',
        restaurantId: 'rest-a',
        orderTotal: 50,
        usageCount: 0,
      },
    );
    expect(inactive).toBe('კუპონი არ მოიძებნა ან გათიშულია');
  });

  it('enforces minimum order and usage limit', () => {
    expect(
      validateCouponApplicability(baseRestaurantCoupon, {
        userId: 'u1',
        restaurantId: 'rest-a',
        orderTotal: 20,
        usageCount: 0,
      }),
    ).toContain('მინიმალური თანხა');

    expect(
      validateCouponApplicability(baseRestaurantCoupon, {
        userId: 'u1',
        restaurantId: 'rest-a',
        orderTotal: 50,
        usageCount: 100,
      }),
    ).toBe('კუპონის გამოყენების ლიმიტი ამოწურულია');
  });

  it('rejects restaurant coupon for another restaurant cart', () => {
    const error = validateCouponApplicability(baseRestaurantCoupon, {
      userId: 'u1',
      restaurantId: 'rest-b',
      orderTotal: 50,
      usageCount: 0,
    });
    expect(error).toBe('ეს კუპონი ამ რესტორანისთვის არ მოქმედებს');
  });

  it('accepts valid restaurant coupon', () => {
    expect(
      isCouponUsableNow(baseRestaurantCoupon, {
        userId: 'u1',
        restaurantId: 'rest-a',
        orderTotal: 50,
        usageCount: 12,
        now: new Date('2026-09-01'),
      }),
    ).toBe(true);
  });

  it('restores balance coupon on cancel', async () => {
    const tx = {
      coupon: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'c1',
          type: 'BALANCE',
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      couponUsage: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    await restoreCouponInTransaction(tx as never, {
      id: 'o1',
      couponId: 'c1',
      discount: 10,
    });

    expect(tx.coupon.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { remainingBalance: { increment: 10 } },
    });
    expect(tx.couponUsage.deleteMany).toHaveBeenCalledWith({
      where: { orderId: 'o1' },
    });
  });

  it('resolves coupon statuses', () => {
    expect(
      resolveCouponStatus({
        ...baseRestaurantCoupon,
        usageCount: 12,
      }),
    ).toBe('ACTIVE');

    expect(
      resolveCouponStatus({
        ...baseRestaurantCoupon,
        usageCount: 100,
      }),
    ).toBe('USAGE_LIMIT_REACHED');
  });
});
