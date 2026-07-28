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
  constructor(private admin: AdminService) {}

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

  @Get('couriers')
  couriers() {
    return this.admin.getCouriers();
  }

  @Get('restaurants')
  restaurants() {
    return this.admin.getRestaurants();
  }

  @Patch('restaurants')
  patchRestaurant(
    @Body() body: { id: string; isApproved?: boolean; isOpen?: boolean },
  ) {
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
