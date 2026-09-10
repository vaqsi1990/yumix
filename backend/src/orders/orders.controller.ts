import {
  Body,
  Controller,
  Delete,
  Get,
  MessageEvent,
  Param,
  Patch,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { OrdersService } from './orders.service';
import { AddressesService } from './addresses.service';
import {
  cancelOrderSchema,
  createAddressSchema,
  createOrderReviewSchema,
  createOrderSchema,
  updateAddressSchema,
} from './dto/order.schemas';
import { OrderEventsService } from './order-events.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private orders: OrdersService,
    private addresses: AddressesService,
    private orderEvents: OrderEventsService,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.listForUser(user.id);
  }

  @Sse(':id/events')
  stream(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      void this.orders
        .getForUser(user.id, id)
        .then(() => {
          const unsubscribe = this.orderEvents.subscribe(id, (event) => {
            subscriber.next({ data: event });
          });
          subscriber.add(() => unsubscribe());
        })
        .catch((error) => subscriber.error(error));
    });
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.orders.getForUser(user.id, id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(cancelOrderSchema)) body: unknown,
  ) {
    const parsed = cancelOrderSchema.parse(body);
    return this.orders.cancelForUser(user.id, id, parsed.reason);
  }

  @Post(':id/review')
  review(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createOrderReviewSchema)) body: unknown,
  ) {
    const parsed = createOrderReviewSchema.parse(body);
    return this.orders.createReview(user.id, id, parsed);
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
