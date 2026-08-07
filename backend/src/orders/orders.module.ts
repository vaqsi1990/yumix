import { Module } from '@nestjs/common';
import { CartModule } from '../cart/cart.module';
import { OrdersController, AddressesController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AddressesService } from './addresses.service';

@Module({
  imports: [CartModule],
  controllers: [OrdersController, AddressesController],
  providers: [OrdersService, AddressesService],
  exports: [OrdersService, AddressesService],
})
export class OrdersModule {}
