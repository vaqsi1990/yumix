import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AccountService } from './account.service';
import {
  updatePreferencesSchema,
  updateProfileSchema,
} from './dto/account.schemas';

@Controller('account')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('USER')
export class AccountController {
  constructor(private account: AccountService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.account.getDashboard(user.id);
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.account.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: unknown,
  ) {
    return this.account.updateProfile(
      user.id,
      body as ReturnType<typeof updateProfileSchema.parse>,
    );
  }

  @Get('preferences')
  preferences(@CurrentUser() user: AuthUser) {
    return this.account.getPreferences(user.id);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updatePreferencesSchema)) body: unknown,
  ) {
    return this.account.updatePreferences(
      user.id,
      body as ReturnType<typeof updatePreferencesSchema.parse>,
    );
  }

  @Delete()
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.account.deleteAccount(user.id);
  }

  @Get('favorites/summary')
  favoritesSummary(@CurrentUser() user: AuthUser) {
    return this.account.getFavoritesSummary(user.id);
  }

  @Get('favorites/restaurants')
  favoriteRestaurants(@CurrentUser() user: AuthUser) {
    return this.account.listFavoriteRestaurants(user.id);
  }

  @Post('favorites/restaurants/:restaurantId')
  addFavoriteRestaurant(
    @CurrentUser() user: AuthUser,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.account.addFavoriteRestaurant(user.id, restaurantId);
  }

  @Delete('favorites/restaurants/:restaurantId')
  removeFavoriteRestaurant(
    @CurrentUser() user: AuthUser,
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.account.removeFavoriteRestaurant(user.id, restaurantId);
  }

  @Get('favorites/products')
  favoriteProducts(@CurrentUser() user: AuthUser) {
    return this.account.listFavoriteProducts(user.id);
  }

  @Post('favorites/products/:productId')
  addFavoriteProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.account.addFavoriteProduct(user.id, productId);
  }

  @Delete('favorites/products/:productId')
  removeFavoriteProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.account.removeFavoriteProduct(user.id, productId);
  }

  @Get('notifications')
  notifications(@CurrentUser() user: AuthUser) {
    return this.account.listNotifications(user.id);
  }

  @Patch('notifications/:id/read')
  markNotificationRead(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.account.markNotificationRead(user.id, id);
  }

  @Patch('notifications/read-all')
  markAllNotificationsRead(@CurrentUser() user: AuthUser) {
    return this.account.markAllNotificationsRead(user.id);
  }
}
