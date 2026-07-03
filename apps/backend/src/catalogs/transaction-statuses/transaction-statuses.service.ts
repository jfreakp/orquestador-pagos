import { Injectable } from '@nestjs/common';
import { Prisma, PrismaService, TransactionStatus } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class TransactionStatusesService extends BaseCatalogService<
  TransactionStatus,
  Prisma.TransactionStatusCreateInput,
  Prisma.TransactionStatusUpdateInput
> {
  protected readonly entityName = 'TransactionStatus';
  protected readonly delegate: CrudDelegate<
    TransactionStatus,
    Prisma.TransactionStatusCreateInput,
    Prisma.TransactionStatusUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.transactionStatus;
  }
}
