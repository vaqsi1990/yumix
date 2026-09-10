import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { OrderStatus, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_USER_PREFERENCES } from '../account/dto/account.schemas';

type StatusCopy = { title: string; message: (orderNumber: string) => string };

const CUSTOMER_STATUS_NOTIFICATIONS: Partial<Record<OrderStatus, StatusCopy>> =
  {
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

@Injectable()
export class OrderNotificationsService {
  private readonly logger = new Logger(OrderNotificationsService.name);
  private readonly resend: Resend | null;
  private readonly from: string;

  constructor(
    private prisma: PrismaService,
    config: ConfigService,
  ) {
    const apiKey =
      config.get<string>('RESEND_API_KEY') ??
      config.get<string>('gmail_password');
    this.from =
      config.get<string>('EMAIL_FROM') ??
      (config.get<string>('gmail_user')
        ? `Yumix <${config.get<string>('gmail_user')}>`
        : 'Yumix <onboarding@resend.dev>');
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  private parsePreferences(raw: unknown) {
    const base = { ...DEFAULT_USER_PREFERENCES };
    if (!raw || typeof raw !== 'object') return base;
    const obj = raw as Record<string, unknown>;
    return {
      orderUpdates:
        typeof obj.orderUpdates === 'boolean'
          ? obj.orderUpdates
          : base.orderUpdates,
      orderEmail:
        typeof obj.orderEmail === 'boolean' ? obj.orderEmail : base.orderEmail,
      orderSms:
        typeof obj.orderSms === 'boolean' ? obj.orderSms : base.orderSms,
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

  async notifyCustomerStatus(
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

    const user = await tx.user.findUnique({
      where: { id: input.userId },
      select: { preferences: true, email: true, phone: true },
    });
    const prefs = this.parsePreferences(user?.preferences);

    if (prefs.orderUpdates) {
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

    const message = `${copy.title}. ${copy.message(input.orderNumber)}`;

    if (prefs.orderEmail && user?.email) {
      void this.sendEmail(user.email, copy.title, message);
    }

    if (prefs.orderSms && user?.phone) {
      void this.sendSms(user.phone, message);
    }
  }

  private async sendEmail(to: string, subject: string, text: string) {
    if (!this.resend) {
      this.logger.warn(`Email skipped (no provider): ${subject} -> ${to}`);
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: `${subject} — Yumix`,
      text,
      html: `<p style="font-family:Arial,sans-serif;color:#333;">${text}</p>`,
    });
    if (error) {
      this.logger.error(`Order email failed: ${error.message}`);
    }
  }

  private async sendSms(phone: string, text: string) {
    this.logger.log(`SMS to ${phone}: ${text}`);
  }
}
