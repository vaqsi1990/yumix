import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private shop: ShopService) {}

  @Get('restaurants')
  getRestaurants(@Query('q') q?: string) {
    return this.shop.getPublicRestaurants(q);
  }

  @Get('restaurants/:slug')
  getRestaurantMenu(@Param('slug') slug: string) {
    return this.shop.getRestaurantMenu(slug);
  }
}
