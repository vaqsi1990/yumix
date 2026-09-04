import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
  const orderNumber = process.argv[2]?.trim();
  if (!orderNumber) {
    console.error('Usage: npx ts-node scripts/lookup-order.ts <orderNumber>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { orderNumber },
        { orderNumber: { contains: orderNumber } },
      ],
    },
    include: {
      restaurant: { select: { id: true, name: true, slug: true } },
      courier: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      user: { select: { email: true, firstName: true, lastName: true } },
    },
  });

  if (!order) {
    console.log('NOT_FOUND');
    await app.close();
    return;
  }

  const couriers = await prisma.user.findMany({
    where: { role: 'COURIER' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      courier: { select: { isOnline: true } },
    },
  });

  console.log(
    JSON.stringify(
      {
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          courierId: order.courierId,
          courier: order.courier,
          restaurant: order.restaurant,
          customer: order.user,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt,
        },
        acceptBlockers: {
          needsStatusReady: order.status !== 'READY',
          hasCourierAssigned: order.courierId != null,
          isTerminal: ['DELIVERED', 'CANCELLED'].includes(order.status),
        },
        couriers,
      },
      null,
      2,
    ),
  );

  await app.close();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
