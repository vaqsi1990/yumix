import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CourierService } from './courier.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  CurrentUser,
  type AuthUser,
} from '../common/decorators/current-user.decorator';
import type { OrderStatus } from '../generated/prisma/client';

@Controller('courier')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COURIER', 'ADMIN')
export class CourierController {
  constructor(private courier: CourierService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser) {
    return this.courier.getDashboard(user.id);
  }

  @Get('available')
  available() {
    return this.courier.getAvailable();
  }

  @Get('active')
  active(@CurrentUser() user: AuthUser) {
    return this.courier.getActive(user.id);
  }

  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.courier.getHistory(user.id);
  }

  @Post('orders/:id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.courier.acceptOrder(user.id, id);
  }

  @Patch('orders/:id/status')
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.courier.updateStatus(user.id, id, body.status);
  }
}
