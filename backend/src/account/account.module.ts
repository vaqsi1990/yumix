import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AdminModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
