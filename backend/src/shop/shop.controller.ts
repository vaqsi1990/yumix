import { Controller, Get, Param, Query } from '@nestjs/common';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private shop: ShopService) {}

  @Get('restaurants')
  getRestaurants(@Query('q') q?: string, @Query('menu') menu?: string) {
    if (menu?.trim()) {
      const keywords = menu
        .split(',')
        .map((keyword) => keyword.trim())
        .filter(Boolean);
      return this.shop.getPublicRestaurantsByMenuKeywords(keywords);
    }
    return this.shop.getPublicRestaurants(q);
  }

  @Get('restaurants/:slug')
  getRestaurantMenu(@Param('slug') slug: string) {
    return this.shop.getRestaurantMenu(slug);
  }

  @Get('offers')
  getOffers() {
    return this.shop.getPublicOffers();
  }

  @Get('favorite-foods')
  getFavoriteFoods() {
    return this.shop.getFavoriteFoods();
  }
}
