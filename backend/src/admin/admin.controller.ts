import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService, type ProductWriteInput } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private admin: AdminService) { }

  @Get('stats')
  stats() {
    return this.admin.getStats();
  }

  @Get('orders')
  orders() {
    return this.admin.getOrders();
  }

  @Get('active-orders')
  activeOrders() {
    return this.admin.getActiveOrders();
  }

  @Get('product-categories')
  listProductCategories(@Query('restaurantId') restaurantId?: string) {
    return this.admin.listProductCategories(restaurantId);
  }

  @Post('product-categories')
  createProductCategory(
    @Body() body: { restaurantId: string; name: string; sortOrder?: number },
  ) {
    return this.admin.createProductCategory(body);
  }

  @Patch('product-categories/:id')
  updateProductCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; sortOrder?: number },
  ) {
    return this.admin.updateProductCategory(id, body);
  }
  @Delete('product-categories/:id')
  deleteProductCategory(@Param('id') id: string) {
    return this.admin.deleteProductCategory(id);
  }

  @Get('couriers')
  couriers() {
    return this.admin.getCouriers();
  }

  @Get('restaurants')
  restaurants() {
    return this.admin.getRestaurants();
  }

  @Get('restaurants/:id')
  getRestaurant(@Param('id') id: string) {
    return this.admin.getRestaurant(id);
  }

  @Get('restaurants/:id/menu')
  getRestaurantMenu(@Param('id') id: string) {
    return this.admin.getRestaurantMenu(id);
  }

  @Post('restaurants')
  createRestaurant(@Body() body: Record<string, unknown>) {
    return this.admin.createRestaurant(body);
  }

  @Patch('restaurants/:id')
  updateRestaurant(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.updateRestaurant(id, body);
  }

  @Patch('restaurants')
  patchRestaurant(
    @Body()
    body: {
      id: string;
      isApproved?: boolean;
      isOpen?: boolean;
      [key: string]: unknown;
    },
  ) {
    const isFullUpdate =
      typeof body.name === 'string' ||
      Array.isArray(body.categories) ||
      typeof body.street === 'string';

    if (isFullUpdate) {
      return this.admin.updateRestaurant(body.id, body);
    }

    return this.admin.patchRestaurant(body.id, body);
  }

  @Delete('restaurants/:id')
  deleteRestaurant(@Param('id') id: string) {
    return this.admin.deleteRestaurant(id);
  }

  @Get('users')
  users() {
    return this.admin.getUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.admin.getUser(id);
  }

  @Post('users')
  createUser(@Body() body: Record<string, unknown>) {
    return this.admin.createUser(body as never);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.updateUser(user.id, id, body as never);
  }

  @Delete('users/:id')
  deleteUser(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.admin.deleteUser(user.id, id);
  }

  @Get('settings')
  settings(@CurrentUser() user: AuthUser) {
    return this.admin.getSettings(user.id);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.updateSettings(user.id, body as never);
  }

  @Get('coupons')
  coupons() {
    return this.admin.getCoupons();
  }

  @Post('coupons')
  createCoupon(
    @CurrentUser() user: AuthUser,
    @Body() body: Record<string, unknown>,
  ) {
    return this.admin.createCoupon(user.id, body as never);
  }

  @Patch('coupons/:id')
  updateCoupon(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.admin.updateCoupon(id, body as never);
  }

  @Delete('coupons/:id')
  deactivateCoupon(@Param('id') id: string) {
    return this.admin.deactivateCoupon(id);
  }

  @Get('products')
  products() {
    return this.admin.listProducts();
  }

  @Post('products')
  createProduct(@Body() body: ProductWriteInput) {
    return this.admin.createProduct(body);
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.admin.getProduct(id);
  }

  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body()
    body: ProductWriteInput | { availability: ProductWriteInput['availability'] },
  ) {
    if (
      'availability' in body &&
      Object.keys(body).length === 1 &&
      body.availability
    ) {
      return this.admin.patchAvailability(id, body.availability);
    }
    return this.admin.updateProduct(id, body as ProductWriteInput);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.admin.deleteProduct(id);
  }

  @Post('products/:id/duplicate')
  duplicateProduct(@Param('id') id: string) {
    return this.admin.duplicateProduct(id);
  }
}
