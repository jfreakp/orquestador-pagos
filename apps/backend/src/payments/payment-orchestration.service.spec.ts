import { NotFoundException, NotImplementedException } from '@nestjs/common';
import {
  GatewayBusinessError,
  GatewayCommunicationError,
} from '@orquestador/shared-types';
import { QrCodeService } from '../common/qr-code.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentGatewayClientFactory } from './payment-gateway-client.factory';
import { PaymentOrchestrationService } from './payment-orchestration.service';

const STATUSES: Record<string, { id: number; code: string }> = {
  PENDING: { id: 1, code: 'PENDING' },
  APPROVED: { id: 2, code: 'APPROVED' },
  REJECTED: { id: 3, code: 'REJECTED' },
  ERROR: { id: 4, code: 'ERROR' },
};

const ERROR_CATEGORIES: Record<string, { id: number; code: string }> = {
  COMMUNICATION: { id: 10, code: 'COMMUNICATION' },
  BUSINESS: { id: 11, code: 'BUSINESS' },
  INTERNAL: { id: 12, code: 'INTERNAL' },
};

function buildDto(overrides: Partial<CreatePaymentDto> = {}): CreatePaymentDto {
  return {
    gatewayCode: 'AHORITA',
    channelCode: 'WEB',
    amount: 25,
    currency: 'USD',
    idempotencyKey: 'idem-1',
    ...overrides,
  };
}

describe('PaymentOrchestrationService', () => {
  let prisma: {
    transaction: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    gateway: { findUnique: jest.Mock };
    channel: { findUnique: jest.Mock };
    transactionStatus: { findUnique: jest.Mock };
    gatewayOperationType: { findUnique: jest.Mock };
    transactionStatusHistory: { create: jest.Mock };
    errorCategory: { findUnique: jest.Mock };
    transactionError: { create: jest.Mock };
  };
  let factory: { getClient: jest.Mock };
  let qrCodeService: { generateBase64: jest.Mock };
  let service: PaymentOrchestrationService;

  beforeEach(() => {
    prisma = {
      transaction: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      gateway: { findUnique: jest.fn() },
      channel: { findUnique: jest.fn() },
      transactionStatus: {
        findUnique: jest.fn(({ where: { code } }) =>
          Promise.resolve(STATUSES[code] ?? null),
        ),
      },
      gatewayOperationType: {
        findUnique: jest.fn().mockResolvedValue({ id: 99, code: 'CREATE_PAYMENT' }),
      },
      transactionStatusHistory: { create: jest.fn().mockResolvedValue({}) },
      errorCategory: {
        findUnique: jest.fn(({ where: { code } }) =>
          Promise.resolve(ERROR_CATEGORIES[code] ?? null),
        ),
      },
      transactionError: { create: jest.fn().mockResolvedValue({}) },
    };
    factory = { getClient: jest.fn() };
    qrCodeService = {
      generateBase64: jest.fn().mockResolvedValue('data:image/png;base64,xyz'),
    };
    service = new PaymentOrchestrationService(
      prisma as never,
      factory as unknown as PaymentGatewayClientFactory,
      qrCodeService as unknown as QrCodeService,
    );

    prisma.gateway.findUnique.mockResolvedValue({ id: 1, code: 'AHORITA' });
    prisma.channel.findUnique.mockResolvedValue({ id: 2, code: 'WEB' });
    prisma.transaction.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'tx-1',
        publicId: 'public-tx-1',
        ...data,
        paymentLink: null,
        externalReference: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        transactionStatus: STATUSES['PENDING'],
      }),
    );
    prisma.transaction.update.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'tx-1',
        publicId: 'public-tx-1',
        amount: 25,
        currency: 'USD',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-02'),
        ...data,
        transactionStatus: Object.values(STATUSES).find(
          (s) => s.id === data.transactionStatusId,
        ),
      }),
    );
  });

  describe('createPayment', () => {
    it('returns the existing transaction without calling the gateway when idempotencyKey already exists', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 'tx-existing',
        publicId: 'public-existing',
        amount: 25,
        currency: 'USD',
        paymentLink: 'https://pay.example.com/abc',
        externalReference: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        transactionStatus: STATUSES['PENDING'],
      });

      const result = await service.createPayment(1, buildDto());

      expect(factory.getClient).not.toHaveBeenCalled();
      expect(prisma.transaction.create).not.toHaveBeenCalled();
      expect(qrCodeService.generateBase64).toHaveBeenCalledWith(
        'https://pay.example.com/abc',
      );
      expect(result.publicId).toBe('public-existing');
      expect(result.qrCodeBase64).toBe('data:image/png;base64,xyz');
    });

    it('creates an APPROVED transaction on a successful gateway response', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      const client = {
        createPayment: jest.fn().mockResolvedValue({
          status: 'APPROVED',
          externalReference: 'EXT-123',
        }),
      };
      factory.getClient.mockReturnValue(client);

      const result = await service.createPayment(1, buildDto());

      expect(client.createPayment).toHaveBeenCalledWith({
        amount: 25,
        currency: 'USD',
        transactionPublicId: 'public-tx-1',
      });
      expect(prisma.transaction.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            transactionStatusId: STATUSES['APPROVED'].id,
            externalReference: 'EXT-123',
          }),
        }),
      );
      expect(prisma.transactionStatusHistory.create).toHaveBeenCalledWith({
        data: {
          transactionId: 'tx-1',
          transactionStatusId: STATUSES['APPROVED'].id,
          gatewayOperationTypeId: 99,
        },
      });
      expect(prisma.transactionError.create).not.toHaveBeenCalled();
      expect(result.status).toBe('APPROVED');
    });

    it('marks the transaction ERROR and logs a COMMUNICATION error when the client throws GatewayCommunicationError', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      const client = {
        createPayment: jest
          .fn()
          .mockRejectedValue(new GatewayCommunicationError('timeout')),
      };
      factory.getClient.mockReturnValue(client);

      const result = await service.createPayment(1, buildDto());

      expect(result.status).toBe('ERROR');
      expect(prisma.transactionError.create).toHaveBeenCalledWith({
        data: {
          transactionId: 'tx-1',
          errorCategoryId: ERROR_CATEGORIES['COMMUNICATION'].id,
          gatewayOperationTypeId: 99,
          message: 'timeout',
        },
      });
    });

    it('marks the transaction REJECTED and logs a BUSINESS error when the client throws GatewayBusinessError', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      const client = {
        createPayment: jest
          .fn()
          .mockRejectedValue(new GatewayBusinessError('insufficient funds', 'E01')),
      };
      factory.getClient.mockReturnValue(client);

      const result = await service.createPayment(1, buildDto());

      expect(result.status).toBe('REJECTED');
      expect(prisma.transactionError.create).toHaveBeenCalledWith({
        data: {
          transactionId: 'tx-1',
          errorCategoryId: ERROR_CATEGORIES['BUSINESS'].id,
          gatewayOperationTypeId: 99,
          message: 'insufficient funds',
        },
      });
    });

    it('marks the transaction ERROR and logs an INTERNAL error for any other exception', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      const client = {
        createPayment: jest.fn().mockRejectedValue(new Error('boom')),
      };
      factory.getClient.mockReturnValue(client);

      const result = await service.createPayment(1, buildDto());

      expect(result.status).toBe('ERROR');
      expect(prisma.transactionError.create).toHaveBeenCalledWith({
        data: {
          transactionId: 'tx-1',
          errorCategoryId: ERROR_CATEGORIES['INTERNAL'].id,
          gatewayOperationTypeId: 99,
          message: 'boom',
        },
      });
    });

    it('throws NotFoundException for an unknown gateway without creating a transaction', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      prisma.gateway.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment(1, buildDto({ gatewayCode: 'UNKNOWN' })),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('propagates NotImplementedException without creating a transaction when the gateway has no registered client', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);
      factory.getClient.mockImplementation(() => {
        throw new NotImplementedException(
          "Gateway 'AHORITA' no tiene implementación registrada todavía",
        );
      });

      await expect(service.createPayment(1, buildDto())).rejects.toThrow(
        NotImplementedException,
      );
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });
  });

  describe('getByPublicId', () => {
    it('throws NotFoundException when the transaction does not exist', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.getByPublicId('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('includes qrCodeBase64 when the transaction is PENDING with a paymentLink', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        publicId: 'public-tx-1',
        amount: 25,
        currency: 'USD',
        paymentLink: 'https://pay.example.com/abc',
        externalReference: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        transactionStatus: STATUSES['PENDING'],
      });

      const result = await service.getByPublicId('public-tx-1');

      expect(result.qrCodeBase64).toBe('data:image/png;base64,xyz');
    });

    it('omits qrCodeBase64 once the transaction is no longer PENDING', async () => {
      prisma.transaction.findUnique.mockResolvedValue({
        id: 'tx-1',
        publicId: 'public-tx-1',
        amount: 25,
        currency: 'USD',
        paymentLink: 'https://pay.example.com/abc',
        externalReference: 'EXT-1',
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        transactionStatus: STATUSES['APPROVED'],
      });

      const result = await service.getByPublicId('public-tx-1');

      expect(result.qrCodeBase64).toBeUndefined();
      expect(qrCodeService.generateBase64).not.toHaveBeenCalled();
    });
  });
});
