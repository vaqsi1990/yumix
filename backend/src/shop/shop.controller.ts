import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { ShopService } from './shop.service';

@Controller('shop')
export class ShopController {
  constructor(private shop: ShopService) {}

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  getRecommended(@CurrentUser() user: AuthUser) {
    return this.shop.getRecommendations(user.id);
  }

  @Get('nearby')
  @UseGuards(JwtAuthGuard)
  getNearby(@CurrentUser() user: AuthUser) {
    return this.shop.getNearbyRestaurants(user.id);
  }

  @Get('restaurants/delivery-context')
  @UseGuards(JwtAuthGuard)
  getDeliveryContext(
    @CurrentUser() user: AuthUser,
    @Query('addressId') addressId?: string,
  ) {
    return this.shop.getRestaurantsDeliveryContext(user.id, addressId);
  }

  @Get('restaurants/:slug/delivery-quote')
  @UseGuards(JwtAuthGuard)
  getRestaurantDeliveryQuote(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Query('addressId') addressId?: string,
  ) {
    return this.shop.getRestaurantDeliveryQuote(slug, user.id, addressId);
  }

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

  @Get('restaurants/:slug/addons')
  getRestaurantAddOns(@Param('slug') slug: string) {
    return this.shop.getRestaurantAddOns(slug);
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
