import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { CourierModule } from './courier/courier.module';
import { PrismaModule } from './prisma/prisma.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ShopModule } from './shop/shop.module';
import { OrdersModule } from './orders/orders.module';
import { AccountModule } from './account/account.module';
import { UploadModule } from './upload/upload.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CartModule,
    AdminModule,
    ShopModule,
    CourierModule,
    RestaurantModule,
    OrdersModule,
    AccountModule,
    UploadModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
