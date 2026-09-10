import { BadRequestException } from '@nestjs/common';
import {
  assertProductOrderable,
  assertRestaurantOrderable,
  calcCartLineTotal,
  calcCartSubtotal,
} from './order.utils';

const openWeekdays = Array.from({ length: 7 }, (_, day) => ({
  day,
  openTime: '10:00',
  closeTime: '22:00',
  isClosed: false,
}));

describe('order.utils cart totals', () => {
  it('multiplies addons and customizations by line quantity', () => {
    const line = {
      quantity: 2,
      price: 10,
      addOns: [{ quantity: 1, price: 2 }],
      customizations: [{ quantity: 1, price: 1 }],
    };

    expect(calcCartLineTotal(line)).toBe(26);
    expect(calcCartSubtotal([line])).toBe(26);
  });
});

describe('assertProductOrderable', () => {
  const base = {
    price: 10,
    discountPrice: null,
    isAvailable: true,
    isHidden: false,
    outOfStock: false,
    preparationTime: 15,
    approvalStatus: 'APPROVED' as const,
    deletedAt: null,
  };

  it('rejects soft-deleted products', () => {
    expect(() =>
      assertProductOrderable({ ...base, deletedAt: new Date() }),
    ).toThrow(BadRequestException);
  });
});

describe('assertRestaurantOrderable', () => {
  const restaurant = {
    id: 'r1',
    isOpen: true,
    isApproved: true,
    minimumOrder: null,
    deliveryFee: null,
    workingHours: openWeekdays,
  };

  it('allows scheduled orders during open hours even when placing outside hours', () => {
    const night = new Date('2026-09-10T04:00:00+04:00');
    const lunch = new Date('2026-09-10T12:00:00+04:00');

    expect(() =>
      assertRestaurantOrderable(restaurant, { asOf: night }),
    ).toThrow('რესტორანი დახურულია');

    expect(() =>
      assertRestaurantOrderable(restaurant, { scheduledFor: lunch }),
    ).not.toThrow();
  });

  it('rejects scheduled orders outside working hours', () => {
    const early = new Date('2026-09-10T08:00:00+04:00');

    expect(() =>
      assertRestaurantOrderable(restaurant, { scheduledFor: early }),
    ).toThrow('რესტორანი არჩეულ დროს დახურულია');
  });

  it('rejects scheduled orders on closed weekdays', () => {
    const closedWednesday = {
      ...restaurant,
      workingHours: openWeekdays.map((row) =>
        row.day === 2 ? { ...row, isClosed: true } : row,
      ),
    };
    const wednesdayNoon = new Date('2026-09-09T12:00:00+04:00');

    expect(() =>
      assertRestaurantOrderable(closedWednesday, {
        scheduledFor: wednesdayNoon,
      }),
    ).toThrow('რესტორანი არჩეულ დროს დახურულია');
  });
});
