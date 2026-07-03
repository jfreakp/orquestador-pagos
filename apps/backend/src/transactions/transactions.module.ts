import { Module } from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { QrCodeService } from '../common/qr-code.service';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, QrCodeService, AdminAuthGuard],
})
export class TransactionsModule {}
