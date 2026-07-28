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
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthUser) {
    return this.cart.getCart(user.id);
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cart.clearCart(user.id);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { quantity?: number },
  ) {
    return this.cart.updateItemQuantity(user.id, id, Number(body.quantity));
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cart.removeItem(user.id, id);
  }

  @Post('coupon')
  applyCoupon(
    @CurrentUser() user: AuthUser,
    @Body() body: { code?: string },
  ) {
    return this.cart.applyCoupon(user.id, body.code ?? '');
  }

  @Delete('coupon')
  removeCoupon(@CurrentUser() user: AuthUser) {
    return this.cart.removeCoupon(user.id);
  }
}
