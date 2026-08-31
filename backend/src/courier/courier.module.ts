import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';

@Module({
  imports: [PrismaModule],
  controllers: [CourierController],
  providers: [CourierService],
})
export class CourierModule {}
