import { Module } from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { TransactionErrorsController } from './transaction-errors.controller';
import { TransactionErrorsService } from './transaction-errors.service';

@Module({
  controllers: [TransactionErrorsController],
  providers: [TransactionErrorsService, AdminAuthGuard],
})
export class TransactionErrorsModule {}
