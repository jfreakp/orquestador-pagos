import { NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../common/encryption.service';
import { GatewayAuthClientFactory } from './gateway-auth-client.factory';
import { GatewayAuthTokenService } from './gateway-auth-token.service';

function buildEncryptionServiceMock() {
  return {
    encrypt: jest.fn((value: unknown) => Buffer.from(JSON.stringify(value))),
    decrypt: jest.fn((buf: Buffer) => JSON.parse(buf.toString('utf8'))),
  };
}

describe('GatewayAuthTokenService', () => {
  let prisma: {
    $queryRaw: jest.Mock;
    $transaction: jest.Mock;
    gateway: { findUnique: jest.Mock };
    gatewayAuthToken: { findFirst: jest.Mock; create: jest.Mock };
    errorCategory: { findUnique: jest.Mock };
    transactionError: { create: jest.Mock };
  };
  let encryptionService: ReturnType<typeof buildEncryptionServiceMock>;
  let authClientFactory: { resolve: jest.Mock };
  let service: GatewayAuthTokenService;

  beforeEach(() => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue(undefined),
      $transaction: jest.fn((callback) => callback(prisma)),
      gateway: { findUnique: jest.fn() },
      gatewayAuthToken: { findFirst: jest.fn(), create: jest.fn() },
      errorCategory: { findUnique: jest.fn() },
      transactionError: { create: jest.fn() },
    };
    encryptionService = buildEncryptionServiceMock();
    authClientFactory = { resolve: jest.fn() };
    service = new GatewayAuthTokenService(
      prisma as never,
      encryptionService as unknown as EncryptionService,
      authClientFactory as unknown as GatewayAuthClientFactory,
    );
  });

  it('returns the existing access token when it has not expired', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 1, code: 'AHORITA' });
    prisma.gatewayAuthToken.findFirst.mockResolvedValueOnce({
      accessToken: encryptionService.encrypt('valid-token'),
      expiresAt: new Date(Date.now() + 60_000),
    });

    const token = await service.getValidAccessToken('AHORITA');

    expect(token).toBe('valid-token');
    expect(authClientFactory.resolve).not.toHaveBeenCalled();
    expect(prisma.gatewayAuthToken.create).not.toHaveBeenCalled();
  });

  it('calls authorizeAccess when there is no previous token', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 1, code: 'AHORITA' });
    prisma.gatewayAuthToken.findFirst
      .mockResolvedValueOnce(null) // active token lookup
      .mockResolvedValueOnce(null); // last token lookup

    const authClient = {
      authorizeAccess: jest.fn().mockResolvedValue({
        accessToken: 'new-token',
        expiresAt: new Date(Date.now() + 3600_000),
      }),
      refreshToken: jest.fn(),
    };
    authClientFactory.resolve.mockReturnValue(authClient);

    const token = await service.getValidAccessToken('AHORITA');

    expect(token).toBe('new-token');
    expect(authClient.authorizeAccess).toHaveBeenCalled();
    expect(authClient.refreshToken).not.toHaveBeenCalled();
    expect(prisma.gatewayAuthToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ gatewayId: 1 }),
      }),
    );
  });

  it('calls refreshToken when there is an expired token with a refreshToken', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 1, code: 'AHORITA' });
    prisma.gatewayAuthToken.findFirst
      .mockResolvedValueOnce(null) // active token lookup
      .mockResolvedValueOnce({
        refreshToken: encryptionService.encrypt('old-refresh-token'),
      }); // last token lookup

    const authClient = {
      authorizeAccess: jest.fn(),
      refreshToken: jest.fn().mockResolvedValue({
        accessToken: 'refreshed-token',
        expiresAt: new Date(Date.now() + 3600_000),
      }),
    };
    authClientFactory.resolve.mockReturnValue(authClient);

    const token = await service.getValidAccessToken('AHORITA');

    expect(token).toBe('refreshed-token');
    expect(authClient.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    expect(authClient.authorizeAccess).not.toHaveBeenCalled();
  });

  it('registers a TransactionError with AUTH category and rethrows on failure', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 1, code: 'AHORITA' });
    prisma.gatewayAuthToken.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    prisma.errorCategory.findUnique.mockResolvedValue({ id: 5, code: 'AUTH' });

    const authClient = {
      authorizeAccess: jest.fn().mockRejectedValue(new Error('gateway down')),
      refreshToken: jest.fn(),
    };
    authClientFactory.resolve.mockReturnValue(authClient);

    await expect(service.getValidAccessToken('AHORITA')).rejects.toThrow(
      'gateway down',
    );
    expect(prisma.transactionError.create).toHaveBeenCalledWith({
      data: {
        transactionId: null,
        errorCategoryId: 5,
        message: 'Failed to obtain access token for gateway: AHORITA',
      },
    });
  });

  it('throws NotFoundException for an unknown gateway', async () => {
    prisma.gateway.findUnique.mockResolvedValue(null);

    await expect(service.getValidAccessToken('UNKNOWN')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.gatewayAuthToken.findFirst).not.toHaveBeenCalled();
  });
});
