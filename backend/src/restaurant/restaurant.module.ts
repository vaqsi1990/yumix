import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { OrdersModule } from '../orders/orders.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantPanelService } from './restaurant.service';

@Module({
  imports: [PrismaModule, AdminModule, OrdersModule],
  controllers: [RestaurantController],
  providers: [RestaurantPanelService],
})
export class RestaurantModule {}
