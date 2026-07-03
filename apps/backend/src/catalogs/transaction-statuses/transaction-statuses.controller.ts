import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { TransactionStatus } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { CreateTransactionStatusDto } from './dto/create-transaction-status.dto';
import { UpdateTransactionStatusDto } from './dto/update-transaction-status.dto';
import { TransactionStatusesService } from './transaction-statuses.service';

@Controller('transaction-statuses')
export class TransactionStatusesController extends BaseCatalogController<
  TransactionStatus,
  CreateTransactionStatusDto,
  UpdateTransactionStatusDto
> {
  constructor(protected readonly service: TransactionStatusesService) {
    super();
  }

  @Post()
  create(@Body() dto: CreateTransactionStatusDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionStatusDto,
  ) {
    return this.service.update(id, dto);
  }
}
