import { NotFoundException } from '@nestjs/common';
import { QrCodeService } from '../common/qr-code.service';
import { TransactionsService } from './transactions.service';

function buildTransactionRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'tx-1',
    publicId: 'public-1',
    amount: 25,
    currency: 'USD',
    paymentLink: null,
    externalReference: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    gateway: { code: 'AHORITA' },
    channel: { code: 'WEB' },
    clientSystem: { code: 'SYS_A' },
    transactionStatus: { code: 'PENDING' },
    ...overrides,
  };
}

describe('TransactionsService', () => {
  let prisma: {
    transaction: { findMany: jest.Mock; count: jest.Mock; findUnique: jest.Mock };
  };
  let qrCodeService: { generateBase64: jest.Mock };
  let service: TransactionsService;

  beforeEach(() => {
    prisma = {
      transaction: {
        findMany: jest.fn().mockResolvedValue([buildTransactionRow()]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(),
      },
    };
    qrCodeService = {
      generateBase64: jest.fn().mockResolvedValue('data:image/png;base64,xyz'),
    };
    service = new TransactionsService(
      prisma as never,
      qrCodeService as unknown as QrCodeService,
    );
  });

  describe('findAll', () => {
    it('builds a where clause from the provided filters', async () => {
      const dateFrom = new Date('2026-01-01');
      const dateTo = new Date('2026-01-31');

      await service.findAll({
        gatewayCode: 'AHORITA',
        statusCode: 'APPROVED',
        channelCode: 'WEB',
        clientSystemCode: 'SYS_A',
        dateFrom,
        dateTo,
      });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            gateway: { code: 'AHORITA' },
            transactionStatus: { code: 'APPROVED' },
            channel: { code: 'WEB' },
            clientSystem: { code: 'SYS_A' },
            createdAt: { gte: dateFrom, lte: dateTo },
          },
        }),
      );
    });

    it('omits filters that were not provided', async () => {
      await service.findAll({});

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('maps rows to flattened list items', async () => {
      const result = await service.findAll({});

      expect(result.items).toEqual([
        {
          publicId: 'public-1',
          gatewayCode: 'AHORITA',
          channelCode: 'WEB',
          clientSystemCode: 'SYS_A',
          statusCode: 'PENDING',
          amount: 25,
          currency: 'USD',
          externalReference: undefined,
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
      ]);
      expect(result.total).toBe(1);
    });
  });

  describe('findByPublicId', () => {
    it('throws NotFoundException when missing', async () => {
      prisma.transaction.findUnique.mockResolvedValue(null);

      await expect(service.findByPublicId('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('includes status history and regenerates the QR when PENDING with a paymentLink', async () => {
      prisma.transaction.findUnique.mockResolvedValue(
        buildTransactionRow({
          paymentLink: 'https://pay.example.com/abc',
          statusHistory: [
            {
              transactionStatus: { code: 'PENDING' },
              gatewayOperationType: { code: 'CREATE_PAYMENT' },
              note: null,
              createdAt: new Date('2026-01-01T10:00:00Z'),
            },
          ],
        }),
      );

      const result = await service.findByPublicId('public-1');

      expect(qrCodeService.generateBase64).toHaveBeenCalledWith(
        'https://pay.example.com/abc',
      );
      expect(result.qrCodeBase64).toBe('data:image/png;base64,xyz');
      expect(result.statusHistory).toEqual([
        {
          statusCode: 'PENDING',
          operationTypeCode: 'CREATE_PAYMENT',
          note: undefined,
          createdAt: new Date('2026-01-01T10:00:00Z'),
        },
      ]);
    });

    it('does not regenerate the QR once the transaction is no longer PENDING', async () => {
      prisma.transaction.findUnique.mockResolvedValue(
        buildTransactionRow({
          paymentLink: 'https://pay.example.com/abc',
          transactionStatus: { code: 'APPROVED' },
          statusHistory: [],
        }),
      );

      const result = await service.findByPublicId('public-1');

      expect(qrCodeService.generateBase64).not.toHaveBeenCalled();
      expect(result.qrCodeBase64).toBeUndefined();
    });

    it('includes plain JSON payloads and base64-encoded encrypted payloads', async () => {
      prisma.transaction.findUnique.mockResolvedValue(
        buildTransactionRow({
          requestPlain: { amount: 25, currency: 'USD' },
          responsePlain: { status: 'APPROVED' },
          requestEncrypted: Buffer.from('req-cipher'),
          responseEncrypted: Buffer.from('res-cipher'),
          statusHistory: [],
        }),
      );

      const result = await service.findByPublicId('public-1');

      expect(result.requestPlain).toEqual({ amount: 25, currency: 'USD' });
      expect(result.responsePlain).toEqual({ status: 'APPROVED' });
      expect(result.requestEncryptedBase64).toBe(
        Buffer.from('req-cipher').toString('base64'),
      );
      expect(result.responseEncryptedBase64).toBe(
        Buffer.from('res-cipher').toString('base64'),
      );
    });

    it('omits encrypted/plain fields when the transaction has none', async () => {
      prisma.transaction.findUnique.mockResolvedValue(
        buildTransactionRow({ statusHistory: [] }),
      );

      const result = await service.findByPublicId('public-1');

      expect(result.requestPlain).toBeUndefined();
      expect(result.responsePlain).toBeUndefined();
      expect(result.requestEncryptedBase64).toBeUndefined();
      expect(result.responseEncryptedBase64).toBeUndefined();
    });
  });
});
