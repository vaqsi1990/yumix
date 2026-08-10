import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
