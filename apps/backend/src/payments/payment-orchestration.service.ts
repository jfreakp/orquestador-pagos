import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PrismaService, Transaction } from '@orquestador/prisma';
import {
  GatewayBusinessError,
  GatewayCommunicationError,
  GatewayPaymentResult,
} from '@orquestador/shared-types';
import { QrCodeService } from '../common/qr-code.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentGatewayClientFactory } from './payment-gateway-client.factory';
import { PaymentResponseDto } from './payment-response.dto';

type TransactionWithStatus = Transaction & {
  transactionStatus: { code: string };
};

type ErrorCategoryCode = 'COMMUNICATION' | 'BUSINESS' | 'INTERNAL';

@Injectable()
export class PaymentOrchestrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentGatewayClientFactory: PaymentGatewayClientFactory,
    private readonly qrCodeService: QrCodeService,
  ) {}

  async createPayment(
    clientSystemId: number,
    dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    const existing = await this.prisma.transaction.findUnique({
      where: {
        clientSystemId_idempotencyKey: {
          clientSystemId,
          idempotencyKey: dto.idempotencyKey,
        },
      },
      include: { transactionStatus: true },
    });
    if (existing) {
      return this.toResponseDto(existing);
    }

    const [gateway, channel, pendingStatus] = await Promise.all([
      this.prisma.gateway.findUnique({ where: { code: dto.gatewayCode } }),
      this.prisma.channel.findUnique({ where: { code: dto.channelCode } }),
      this.prisma.transactionStatus.findUnique({ where: { code: 'PENDING' } }),
    ]);
    if (!gateway) {
      throw new NotFoundException(`Unknown gateway: ${dto.gatewayCode}`);
    }
    if (!channel) {
      throw new NotFoundException(`Unknown channel: ${dto.channelCode}`);
    }
    if (!pendingStatus) {
      throw new InternalServerErrorException(
        'Missing PENDING transaction status seed',
      );
    }

    // Resuelto antes de crear la transacción: si el gateway no tiene
    // implementación registrada, fallamos rápido sin dejar una
    // transacción PENDING huérfana que nunca podrá completarse.
    const client = this.paymentGatewayClientFactory.getClient(dto.gatewayCode);

    let transaction = await this.prisma.transaction.create({
      data: {
        clientSystemId,
        gatewayId: gateway.id,
        channelId: channel.id,
        transactionStatusId: pendingStatus.id,
        idempotencyKey: dto.idempotencyKey,
        amount: dto.amount,
        currency: dto.currency,
        requestPlain: {
          amount: dto.amount,
          currency: dto.currency,
        } as Prisma.InputJsonValue,
      },
      include: { transactionStatus: true },
    });

    let result: GatewayPaymentResult;
    let errorCategoryCode: ErrorCategoryCode | null = null;
    let errorMessage: string | undefined;

    try {
      result = await client.createPayment({
        amount: dto.amount,
        currency: dto.currency,
        transactionPublicId: transaction.publicId,
      });

      if (result.status === 'REJECTED') {
        errorCategoryCode = 'BUSINESS';
        errorMessage = result.errorMessage ?? 'Payment rejected by gateway';
      } else if (result.status === 'ERROR') {
        errorCategoryCode = 'INTERNAL';
        errorMessage = result.errorMessage ?? 'Gateway returned an error status';
      }
    } catch (error) {
      if (error instanceof GatewayCommunicationError) {
        errorCategoryCode = 'COMMUNICATION';
        errorMessage = error.message;
        result = { status: 'ERROR', errorMessage: error.message };
      } else if (error instanceof GatewayBusinessError) {
        errorCategoryCode = 'BUSINESS';
        errorMessage = error.message;
        result = {
          status: 'REJECTED',
          errorCode: error.errorCode,
          errorMessage: error.message,
        };
      } else {
        errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errorCategoryCode = 'INTERNAL';
        result = { status: 'ERROR', errorMessage };
      }
    }

    const newStatus = await this.prisma.transactionStatus.findUnique({
      where: { code: result.status },
    });
    if (!newStatus) {
      throw new InternalServerErrorException(
        `Missing ${result.status} transaction status seed`,
      );
    }

    transaction = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        transactionStatusId: newStatus.id,
        paymentLink: result.paymentLink,
        externalReference: result.externalReference,
        requestEncrypted: toBytesOrUndefined(result.rawRequestEncrypted),
        requestPlain: toJsonOrUndefined(result.rawRequestPlain),
        responseEncrypted: toBytesOrUndefined(result.rawResponseEncrypted),
        responsePlain: toJsonOrUndefined(result.rawResponsePlain),
      },
      include: { transactionStatus: true },
    });

    const createPaymentOperationType =
      await this.prisma.gatewayOperationType.findUnique({
        where: { code: 'CREATE_PAYMENT' },
      });

    await this.prisma.transactionStatusHistory.create({
      data: {
        transactionId: transaction.id,
        transactionStatusId: newStatus.id,
        gatewayOperationTypeId: createPaymentOperationType?.id,
      },
    });

    if (errorCategoryCode) {
      await this.registerTransactionError(
        transaction.id,
        errorCategoryCode,
        errorMessage ?? 'Unknown error',
        createPaymentOperationType?.id,
      );
    }

    return this.toResponseDto(transaction);
  }

  async getByPublicId(publicId: string): Promise<PaymentResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { publicId },
      include: { transactionStatus: true },
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction not found: ${publicId}`);
    }
    return this.toResponseDto(transaction);
  }

  private async registerTransactionError(
    transactionId: string,
    categoryCode: ErrorCategoryCode,
    message: string,
    gatewayOperationTypeId?: number,
  ): Promise<void> {
    const category = await this.prisma.errorCategory.findUnique({
      where: { code: categoryCode },
    });
    if (!category) {
      return;
    }
    await this.prisma.transactionError.create({
      data: {
        transactionId,
        errorCategoryId: category.id,
        gatewayOperationTypeId,
        message,
      },
    });
  }

  private async toResponseDto(
    transaction: TransactionWithStatus,
  ): Promise<PaymentResponseDto> {
    const isPending = transaction.transactionStatus.code === 'PENDING';
    const qrCodeBase64 =
      isPending && transaction.paymentLink
        ? await this.qrCodeService.generateBase64(transaction.paymentLink)
        : undefined;

    return {
      publicId: transaction.publicId,
      status: transaction.transactionStatus.code,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      paymentLink: transaction.paymentLink ?? undefined,
      externalReference: transaction.externalReference ?? undefined,
      qrCodeBase64,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}

function toBytesOrUndefined(value: unknown): Buffer | undefined {
  if (value instanceof Buffer) {
    return value;
  }
  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }
  return undefined;
}

function toJsonOrUndefined(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}
