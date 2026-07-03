import { TransactionErrorsService } from './transaction-errors.service';

describe('TransactionErrorsService', () => {
  let prisma: {
    transactionError: { findMany: jest.Mock; count: jest.Mock };
  };
  let service: TransactionErrorsService;

  beforeEach(() => {
    prisma = {
      transactionError: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new TransactionErrorsService(prisma as never);
  });

  it('builds a where clause from the provided filters', async () => {
    await service.findAll({
      errorCategoryCode: 'AUTH',
      gatewayCode: 'AHORITA',
    });

    expect(prisma.transactionError.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          errorCategory: { code: 'AUTH' },
          transaction: { gateway: { code: 'AHORITA' } },
        },
      }),
    );
  });

  it('omits filters that were not provided', async () => {
    await service.findAll({});

    expect(prisma.transactionError.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });

  it('maps rows to list items, tolerating errors without a transaction', async () => {
    prisma.transactionError.findMany.mockResolvedValue([
      {
        id: 1,
        message: 'Missing bearer token',
        createdAt: new Date('2026-01-01'),
        transaction: null,
        errorCategory: { code: 'AUTH' },
        gatewayOperationType: null,
      },
      {
        id: 2,
        message: 'gateway down',
        createdAt: new Date('2026-01-02'),
        transaction: { publicId: 'public-1', gateway: { code: 'AHORITA' } },
        errorCategory: { code: 'COMMUNICATION' },
        gatewayOperationType: { code: 'CREATE_PAYMENT' },
      },
    ]);
    prisma.transactionError.count.mockResolvedValue(2);

    const result = await service.findAll({});

    expect(result.items).toEqual([
      {
        id: 1,
        transactionPublicId: undefined,
        errorCategoryCode: 'AUTH',
        gatewayCode: undefined,
        gatewayOperationTypeCode: undefined,
        message: 'Missing bearer token',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 2,
        transactionPublicId: 'public-1',
        errorCategoryCode: 'COMMUNICATION',
        gatewayCode: 'AHORITA',
        gatewayOperationTypeCode: 'CREATE_PAYMENT',
        message: 'gateway down',
        createdAt: new Date('2026-01-02'),
      },
    ]);
  });
});
