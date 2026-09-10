import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersController, AddressesController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AddressesService } from './addresses.service';
import { OrderEventsService } from './order-events.service';
import { OrderNotificationsService } from './order-notifications.service';

@Module({
  imports: [PrismaModule, CartModule],
  controllers: [OrdersController, AddressesController],
  providers: [
    OrdersService,
    AddressesService,
    OrderEventsService,
    OrderNotificationsService,
  ],
  exports: [
    OrdersService,
    AddressesService,
    OrderEventsService,
    OrderNotificationsService,
  ],
})
export class OrdersModule {}
