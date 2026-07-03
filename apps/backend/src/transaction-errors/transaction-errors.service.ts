import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@orquestador/prisma';
import { PaginatedResult } from '../catalogs/base-catalog.service';

export interface TransactionErrorListFilters {
  errorCategoryCode?: string;
  gatewayCode?: string;
}

export interface TransactionErrorListItem {
  id: number;
  transactionPublicId?: string;
  errorCategoryCode: string;
  gatewayCode?: string;
  gatewayOperationTypeCode?: string;
  message: string;
  createdAt: Date;
}

export interface TransactionErrorDetail extends TransactionErrorListItem {
  details?: unknown;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const errorInclude = {
  transaction: { include: { gateway: true } },
  errorCategory: true,
  gatewayOperationType: true,
} satisfies Prisma.TransactionErrorInclude;

type TransactionErrorWithRelations = Prisma.TransactionErrorGetPayload<{
  include: typeof errorInclude;
}>;

@Injectable()
export class TransactionErrorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: TransactionErrorListFilters,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<TransactionErrorListItem>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const where: Prisma.TransactionErrorWhereInput = {
      ...(filters.errorCategoryCode
        ? { errorCategory: { code: filters.errorCategoryCode } }
        : {}),
      ...(filters.gatewayCode
        ? { transaction: { gateway: { code: filters.gatewayCode } } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.transactionError.findMany({
        where,
        include: errorInclude,
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transactionError.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toListItem(item)),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findById(id: number): Promise<TransactionErrorDetail> {
    const error = await this.prisma.transactionError.findUnique({
      where: { id },
      include: errorInclude,
    });
    if (!error) {
      throw new NotFoundException(`TransactionError not found: ${id}`);
    }
    return {
      ...this.toListItem(error),
      details: error.details ?? undefined,
    };
  }

  private toListItem(
    error: TransactionErrorWithRelations,
  ): TransactionErrorListItem {
    return {
      id: error.id,
      transactionPublicId: error.transaction?.publicId,
      errorCategoryCode: error.errorCategory.code,
      gatewayCode: error.transaction?.gateway.code,
      gatewayOperationTypeCode: error.gatewayOperationType?.code,
      message: error.message,
      createdAt: error.createdAt,
    };
  }
}
