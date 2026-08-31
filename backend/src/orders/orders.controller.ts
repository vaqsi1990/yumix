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
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';
import { AddressesService } from './addresses.service';
import {
  createAddressSchema,
  createOrderSchema,
  updateAddressSchema,
} from './dto/order.schemas';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private addresses: AddressesService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.listForUser(user.id);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.getForUser(user.id, id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createOrderSchema)) body: unknown,
  ) {
    return this.orders.createFromCart(
      user.id,
      body as ReturnType<typeof createOrderSchema.parse>,
    );
  }

  @Post(':id/reorder')
  reorder(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.reorder(user.id, id);
  }
}

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private addresses: AddressesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.addresses.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createAddressSchema)) body: unknown,
  ) {
    return this.addresses.create(
      user.id,
      body as ReturnType<typeof createAddressSchema.parse>,
    );
  }

  @Patch(':id/default')
  setDefault(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addresses.setDefault(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAddressSchema)) body: unknown,
  ) {
    return this.addresses.update(
      user.id,
      id,
      body as ReturnType<typeof updateAddressSchema.parse>,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.addresses.remove(user.id, id);
  }
}
