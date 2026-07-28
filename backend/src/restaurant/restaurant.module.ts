import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RestaurantController } from './restaurant.controller';
import { RestaurantPanelService } from './restaurant.service';

@Module({
  imports: [PrismaModule],
  controllers: [RestaurantController],
  providers: [RestaurantPanelService],
})
export class RestaurantModule {}
