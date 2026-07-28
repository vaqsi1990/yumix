import { Controller, Get, Query } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private shop: ShopService) {}

  @Get('restaurants')
  getRestaurants(@Query('q') q?: string) {
    return this.shop.getPublicRestaurants(q);
  }
}
