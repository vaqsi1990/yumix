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
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  addCartExtraSchema,
  addCartItemSchema,
  updateCartItemSchema,
} from './dto/cart.schemas';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cart: CartService) {}

  @Get()
  getCart(
    @CurrentUser() user: AuthUser,
    @Query('addressId') addressId?: string,
  ) {
    return this.cart.getCart(user.id, addressId);
  }

  @Post('items')
  addItem(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addCartItemSchema)) body: unknown,
  ) {
    return this.cart.addItem(user.id, body as ReturnType<typeof addCartItemSchema.parse>);
  }

  @Post('extras')
  addExtra(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(addCartExtraSchema)) body: unknown,
  ) {
    return this.cart.addExtraItem(
      user.id,
      body as ReturnType<typeof addCartExtraSchema.parse>,
    );
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cart.clearCart(user.id);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCartItemSchema))
    body: { quantity?: number; variantId?: string },
  ) {
    return this.cart.updateItem(user.id, id, body);
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
