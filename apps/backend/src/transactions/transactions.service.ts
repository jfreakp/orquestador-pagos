import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@orquestador/prisma';
import { QrCodeService } from '../common/qr-code.service';
import { PaginatedResult } from '../catalogs/base-catalog.service';

export interface TransactionListFilters {
  gatewayCode?: string;
  statusCode?: string;
  channelCode?: string;
  clientSystemCode?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TransactionListItem {
  publicId: string;
  gatewayCode: string;
  channelCode: string;
  clientSystemCode: string;
  statusCode: string;
  amount: number;
  currency: string;
  externalReference?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionStatusHistoryItem {
  statusCode: string;
  operationTypeCode?: string;
  note?: string;
  createdAt: Date;
}

export interface TransactionDetail extends TransactionListItem {
  paymentLink?: string;
  qrCodeBase64?: string;
  statusHistory: TransactionStatusHistoryItem[];
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const listItemInclude = {
  gateway: true,
  channel: true,
  clientSystem: true,
  transactionStatus: true,
} satisfies Prisma.TransactionInclude;

type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: typeof listItemInclude;
}>;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly qrCodeService: QrCodeService,
  ) {}

  async findAll(
    filters: TransactionListFilters,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<TransactionListItem>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const where: Prisma.TransactionWhereInput = {
      ...(filters.gatewayCode ? { gateway: { code: filters.gatewayCode } } : {}),
      ...(filters.statusCode
        ? { transactionStatus: { code: filters.statusCode } }
        : {}),
      ...(filters.channelCode ? { channel: { code: filters.channelCode } } : {}),
      ...(filters.clientSystemCode
        ? { clientSystem: { code: filters.clientSystemCode } }
        : {}),
      ...(filters.dateFrom || filters.dateTo
        ? {
            createdAt: {
              ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
              ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: listItemInclude,
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toListItem(item)),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findByPublicId(publicId: string): Promise<TransactionDetail> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { publicId },
      include: {
        ...listItemInclude,
        statusHistory: {
          include: { transactionStatus: true, gatewayOperationType: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${publicId}`);
    }

    const isPending = transaction.transactionStatus.code === 'PENDING';
    const qrCodeBase64 =
      isPending && transaction.paymentLink
        ? await this.qrCodeService.generateBase64(transaction.paymentLink)
        : undefined;

    return {
      ...this.toListItem(transaction),
      paymentLink: transaction.paymentLink ?? undefined,
      qrCodeBase64,
      statusHistory: transaction.statusHistory.map((entry) => ({
        statusCode: entry.transactionStatus.code,
        operationTypeCode: entry.gatewayOperationType?.code,
        note: entry.note ?? undefined,
        createdAt: entry.createdAt,
      })),
    };
  }

  private toListItem(
    transaction: TransactionWithRelations,
  ): TransactionListItem {
    return {
      publicId: transaction.publicId,
      gatewayCode: transaction.gateway.code,
      channelCode: transaction.channel.code,
      clientSystemCode: transaction.clientSystem.code,
      statusCode: transaction.transactionStatus.code,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      externalReference: transaction.externalReference ?? undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
