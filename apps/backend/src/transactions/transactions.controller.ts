import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { TransactionsService } from './transactions.service';

function parseDate(value: string | undefined, fieldName: string): Date | undefined {
  if (value === undefined) {
    return undefined;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${fieldName} must be a valid ISO date`);
  }
  return date;
}

@UseGuards(AdminAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(
    @Query('gatewayCode') gatewayCode?: string,
    @Query('statusCode') statusCode?: string,
    @Query('channelCode') channelCode?: string,
    @Query('clientSystemCode') clientSystemCode?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.transactionsService.findAll(
      {
        gatewayCode,
        statusCode,
        channelCode,
        clientSystemCode,
        dateFrom: parseDate(dateFrom, 'dateFrom'),
        dateTo: parseDate(dateTo, 'dateTo'),
      },
      page !== undefined ? Number(page) : undefined,
      pageSize !== undefined ? Number(pageSize) : undefined,
    );
  }

  @Get(':publicId')
  findOne(@Param('publicId') publicId: string) {
    return this.transactionsService.findByPublicId(publicId);
  }
}
