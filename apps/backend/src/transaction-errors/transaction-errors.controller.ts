import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { TransactionErrorsService } from './transaction-errors.service';

@UseGuards(AdminAuthGuard)
@Controller('transaction-errors')
export class TransactionErrorsController {
  constructor(
    private readonly transactionErrorsService: TransactionErrorsService,
  ) {}

  @Get()
  findAll(
    @Query('errorCategoryCode') errorCategoryCode?: string,
    @Query('gatewayCode') gatewayCode?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.transactionErrorsService.findAll(
      { errorCategoryCode, gatewayCode },
      page !== undefined ? Number(page) : undefined,
      pageSize !== undefined ? Number(pageSize) : undefined,
    );
  }
}
