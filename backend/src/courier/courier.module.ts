import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';

@Module({
  imports: [PrismaModule, OrdersModule],
  controllers: [CourierController],
  providers: [CourierService],
})
export class CourierModule {}
