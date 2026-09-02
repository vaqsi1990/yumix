import { BadRequestException } from '@nestjs/common';
import type { OrderStatus } from '../generated/prisma/client';
import type { Prisma } from '../generated/prisma/client';

export const OWNER_ORDER_TRANSITIONS: Partial<
  Record<OrderStatus, OrderStatus[]>
> = {
  PENDING: ['ACCEPTED', 'PREPARING', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['CANCELLED'],
};

export const COURIER_ORDER_TRANSITIONS: Partial<
  Record<OrderStatus, OrderStatus[]>
> = {
  PICKED_UP: ['ON_THE_WAY'],
  ON_THE_WAY: ['DELIVERED'],
};

const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];

export function assertOrderTransition(
  current: OrderStatus,
  next: OrderStatus,
  allowed: Partial<Record<OrderStatus, OrderStatus[]>>,
) {
  if (TERMINAL_STATUSES.includes(current)) {
    throw new BadRequestException('შეკვეთის სტატუსი ვეღარ იცვლება');
  }

  const permitted = allowed[current] ?? [];
  if (!permitted.includes(next)) {
    throw new BadRequestException(
      `სტატუსის ცვლილება შეუძლებელია: ${current} → ${next}`,
    );
  }
}

type StatusNotificationCopy = {
  title: string;
  message: (orderNumber: string) => string;
};

const CUSTOMER_STATUS_NOTIFICATIONS: Partial<
  Record<OrderStatus, StatusNotificationCopy>
> = {
  PENDING: {
    title: 'თქვენი შეკვეთა მიღებულია',
    message: (orderNumber) => `შეკვეთა ${orderNumber} მიღებულია`,
  },
  ACCEPTED: {
    title: 'რესტორანმა მიიღო თქვენი შეკვეთა',
    message: (orderNumber) => `შეკვეთა ${orderNumber} დადასტურდა`,
  },
  PREPARING: {
    title: 'თქვენი შეკვეთა მზადდება',
    message: (orderNumber) => `შეკვეთა ${orderNumber} მზადდება`,
  },
  READY: {
    title: 'თქვენი შეკვეთა მზად არის',
    message: (orderNumber) => `შეკვეთა ${orderNumber} მზად არის`,
  },
  PICKED_UP: {
    title: 'კურიერმა აიღო თქვენი შეკვეთა',
    message: (orderNumber) => `შეკვეთა ${orderNumber} აღებულია`,
  },
  ON_THE_WAY: {
    title: 'თქვენი შეკვეთა გზაშია',
    message: (orderNumber) => `შეკვეთა ${orderNumber} გზაშია`,
  },
  DELIVERED: {
    title: 'თქვენი შეკვეთა ჩაბარდა',
    message: (orderNumber) => `შეკვეთა ${orderNumber} წარმატებით ჩაბარდა`,
  },
  CANCELLED: {
    title: 'თქვენი შეკვეთა გაუქმდა',
    message: (orderNumber) => `შეკვეთა ${orderNumber} გაუქმდა`,
  },
};

export async function notifyCustomerOrderStatus(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    orderId: string;
    orderNumber: string;
    status: OrderStatus;
    previousStatus?: OrderStatus;
  },
) {
  if (input.previousStatus === input.status) return;

  const copy = CUSTOMER_STATUS_NOTIFICATIONS[input.status];
  if (!copy) return;

  await tx.notification.create({
    data: {
      userId: input.userId,
      orderId: input.orderId,
      title: copy.title,
      message: copy.message(input.orderNumber),
      type: 'ORDER_STATUS',
    },
  });
}
