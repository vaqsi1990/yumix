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
import { RestaurantPanelService } from './restaurant.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import type { ProductWriteInput } from '../admin/admin.service';
import type { OrderStatus } from '../generated/prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { restaurantProductWriteSchema } from '../admin/dto/product.schemas';

@Controller('restaurant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('RESTAURANT_OWNER', 'ADMIN')
export class RestaurantController {
  constructor(private restaurant: RestaurantPanelService) {}

  @Get('shell')
  shell(@CurrentUser() user: AuthUser) {
    return this.restaurant.getShell(user.id, user.role);
  }

  @Post('onboarding')
  createOwnRestaurant(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.restaurant.createOwnRestaurant(user.id, user.role, body);
  }

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.restaurant.getDashboard(user.id, user.role);
  }

  @Get('analytics')
  analytics(@CurrentUser() user: AuthUser) {
    return this.restaurant.getAnalytics(user.id, user.role);
  }

  @Get('profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.restaurant.getSettings(user.id, user.role);
  }

  @Get('account')
  account(@CurrentUser() user: AuthUser) {
    return this.restaurant.getAccount(user.id);
  }

  @Patch('account')
  updateAccount(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.restaurant.updateAccount(user.id, body as never);
  }

  @Get('settings')
  settings(@CurrentUser() user: AuthUser) {
    return this.restaurant.getSettings(user.id, user.role);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.restaurant.updateSettings(user.id, user.role, body);
  }

  @Get('menu')
  menu(@CurrentUser() user: AuthUser) {
    return this.restaurant.getMenu(user.id, user.role);
  }

  @Patch('menu/:id/visibility')
  toggleMenuVisibility(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { visible: boolean },
  ) {
    return this.restaurant.toggleMenuCategoryVisibility(
      user.id,
      user.role,
      id,
      Boolean(body.visible),
    );
  }

  @Get('categories')
  categories(@CurrentUser() user: AuthUser) {
    return this.restaurant.getCategories(user.id, user.role);
  }

  @Post('categories')
  createCategory(
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; sortOrder?: number },
  ) {
    return this.restaurant.createCategory(user.id, user.role, body);
  }

  @Patch('categories/reorder')
  reorderCategories(
    @CurrentUser() user: AuthUser,
    @Body() body: { ids: string[] },
  ) {
    return this.restaurant.reorderCategories(user.id, user.role, body.ids);
  }

  @Patch('categories/:id')
  updateCategory(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { name?: string; sortOrder?: number },
  ) {
    return this.restaurant.updateCategory(user.id, user.role, id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.restaurant.deleteCategory(user.id, user.role, id);
  }

  @Get('products')
  products(@CurrentUser() user: AuthUser) {
    return this.restaurant.getProducts(user.id, user.role);
  }

  @Post('products')
  createProduct(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(restaurantProductWriteSchema))
    body: Omit<ProductWriteInput, 'restaurantId'>,
  ) {
    return this.restaurant.createProduct(user.id, user.role, body);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(restaurantProductWriteSchema))
    body: Omit<ProductWriteInput, 'restaurantId'>,
  ) {
    return this.restaurant.updateProduct(user.id, user.role, id, body);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.restaurant.deleteProduct(user.id, user.role, id);
  }

  @Post('products/:id/duplicate')
  duplicateProduct(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.restaurant.duplicateProduct(user.id, user.role, id);
  }

  @Get('orders')
  orders(@CurrentUser() user: AuthUser) {
    return this.restaurant.getOrders(user.id, user.role);
  }

  @Get('orders/:id')
  order(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.restaurant.getOrder(user.id, user.role, id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.restaurant.updateOrderStatus(
      user.id,
      user.role,
      id,
      body.status,
    );
  }

  @Get('active-orders')
  activeOrders(@CurrentUser() user: AuthUser) {
    return this.restaurant.getOrders(user.id, user.role);
  }

  @Get('reviews')
  reviews(@CurrentUser() user: AuthUser) {
    return this.restaurant.getReviews(user.id, user.role);
  }

  @Delete('reviews/:id')
  deleteReview(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.restaurant.deleteReview(user.id, user.role, id);
  }
}
