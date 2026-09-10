export type CouponType = 'BALANCE' | 'PERCENT' | 'FIXED';

export type CouponStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'EXPIRED'
  | 'NOT_STARTED'
  | 'USAGE_LIMIT_REACHED'
  | 'DEPLETED';

export type CouponForValidation = {
  type: string;
  value: number;
  remainingBalance: number;
  minimumOrder: number | null;
  expiresAt: Date | null;
  startsAt?: Date | null;
  isActive: boolean;
  assignedToId: string | null;
  restaurantId?: string | null;
  usageLimit?: number | null;
};

export type CouponValidationContext = {
  userId: string;
  restaurantId: string | null;
  orderTotal: number;
  usageCount?: number;
  now?: Date;
};

export function normalizeCouponCode(raw: string): string {
  return raw.trim().toUpperCase();
}

export function isCouponExpired(
  expiresAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() < now.getTime();
}

export function isCouponNotStarted(
  startsAt: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!startsAt) return false;
  return startsAt.getTime() > now.getTime();
}

export function isBalanceDepleted(coupon: CouponForValidation): boolean {
  return coupon.type === 'BALANCE' && coupon.remainingBalance <= 0;
}

export function isUsageLimitReached(
  usageCount: number,
  usageLimit: number | null | undefined,
): boolean {
  if (usageLimit == null) return false;
  return usageCount >= usageLimit;
}

export function resolveCouponStatus(
  coupon: CouponForValidation & { usageCount?: number },
  now = new Date(),
): CouponStatus {
  if (!coupon.isActive) return 'INACTIVE';
  if (isCouponExpired(coupon.expiresAt, now)) return 'EXPIRED';
  if (isCouponNotStarted(coupon.startsAt ?? null, now)) return 'NOT_STARTED';
  if (isBalanceDepleted(coupon)) return 'DEPLETED';
  if (
    coupon.type !== 'BALANCE' &&
    isUsageLimitReached(coupon.usageCount ?? 0, coupon.usageLimit ?? null)
  ) {
    return 'USAGE_LIMIT_REACHED';
  }
  return 'ACTIVE';
}

export function computeCouponDiscount(
  coupon: CouponForValidation,
  orderAmountWithDelivery: number,
): number {
  if (orderAmountWithDelivery <= 0) return 0;

  if (coupon.type === 'BALANCE') {
    if (coupon.remainingBalance <= 0) return 0;
    return Math.min(coupon.remainingBalance, orderAmountWithDelivery);
  }

  if (coupon.type === 'PERCENT') {
    const pct = Math.min(100, Math.max(0, coupon.value));
    return (
      Math.round(((orderAmountWithDelivery * pct) / 100) * 100) / 100
    );
  }

  if (coupon.type === 'FIXED') {
    return Math.min(coupon.value, orderAmountWithDelivery);
  }

  return 0;
}

export function validateCouponApplicability(
  coupon: CouponForValidation,
  ctx: CouponValidationContext,
): string | null {
  const now = ctx.now ?? new Date();

  if (!coupon.isActive) {
    return 'კუპონი არ მოიძებნა ან გათიშულია';
  }
  if (coupon.assignedToId && coupon.assignedToId !== ctx.userId) {
    return 'ეს კუპონი შენზე არ არის მინიჭებული';
  }
  if (
    coupon.restaurantId &&
    (!ctx.restaurantId || coupon.restaurantId !== ctx.restaurantId)
  ) {
    return 'ეს კუპონი ამ რესტორანისთვის არ მოქმედებს';
  }
  if (isCouponExpired(coupon.expiresAt, now)) {
    return 'კუპონის ვადა ამოწურულია';
  }
  if (isCouponNotStarted(coupon.startsAt ?? null, now)) {
    return 'კუპონი ჯერ არ არის აქტიური';
  }
  if (coupon.type === 'BALANCE' && isBalanceDepleted(coupon)) {
    return 'კუპონის ბალანსი ამოწურულია';
  }
  if (
    coupon.type !== 'BALANCE' &&
    isUsageLimitReached(ctx.usageCount ?? 0, coupon.usageLimit ?? null)
  ) {
    return 'კუპონის გამოყენების ლიმიტი ამოწურულია';
  }
  if (coupon.minimumOrder != null && ctx.orderTotal < coupon.minimumOrder) {
    return `მინიმალური თანხა: ₾${coupon.minimumOrder.toFixed(2)}`;
  }

  const discount = computeCouponDiscount(coupon, ctx.orderTotal);
  if (discount <= 0) return 'კუპონი არ მოქმედება';
  return null;
}

export function isCouponUsableNow(
  coupon: CouponForValidation & { usageCount?: number },
  ctx: CouponValidationContext,
): boolean {
  return validateCouponApplicability(coupon, ctx) === null;
}

export function parseOptionalDate(value: string | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('INVALID_DATE');
  }
  return date;
}

export function assertValidCouponDateRange(
  startsAt: Date | null,
  expiresAt: Date | null,
): void {
  if (startsAt && expiresAt && expiresAt.getTime() < startsAt.getTime()) {
    throw new Error('DATE_RANGE');
  }
}

export function validateRestaurantCouponValue(
  type: CouponType,
  value: number,
): string | null {
  if (!Number.isFinite(value)) return 'ფასდაკლების ღირებულება არასწორია';
  if (type === 'PERCENT') {
    if (value <= 0 || value > 100) {
      return 'პროცენტი უნდა იყოს 0-ზე მეტი და 100-ზე ნაკლები ან ტოლი';
    }
    return null;
  }
  if (type === 'FIXED') {
    if (value <= 0) return 'ფიქსირებული ფასდაკლება უნდა იყოს 0-ზე მეტი';
    return null;
  }
  return 'კუპონის ტიპი არასწორია';
}

export function validateMinimumOrder(value: number | null | undefined): string | null {
  if (value == null) return null;
  if (!Number.isFinite(value) || value < 0) {
    return 'მინიმალური თანხა არ შეიძლება იყოს უარყოფითი';
  }
  return null;
}

export function validateUsageLimit(value: number | null | undefined): string | null {
  if (value == null) return null;
  if (!Number.isInteger(value) || value <= 0) {
    return 'გამოყენების ლიმიტი უნდა იყოს დადებითი მთელი რიცხვი';
  }
  return null;
}
