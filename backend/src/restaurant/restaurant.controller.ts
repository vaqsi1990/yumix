import { Controller, Get, UseGuards } from '@nestjs/common';
import { RestaurantPanelService } from './restaurant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('restaurant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_OWNER', 'ADMIN')
export class RestaurantController {
  constructor(private restaurant: RestaurantPanelService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.restaurant.getDashboard(user.id, user.role);
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.restaurant.getProfile(user.id, user.role);
  }

  @Get('products')
  products(@CurrentUser() user: AuthUser) {
    return this.restaurant.getProducts(user.id, user.role);
  }

  @Get('orders')
  orders(@CurrentUser() user: AuthUser) {
    return this.restaurant.getOrders(user.id, user.role);
  }

  @Get('active-orders')
  activeOrders(@CurrentUser() user: AuthUser) {
    return this.restaurant.getActiveOrders(user.id, user.role);
  }
}
