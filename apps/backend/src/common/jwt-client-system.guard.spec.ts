import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { generateKeyPairSync } from 'node:crypto';
import * as jwt from 'jsonwebtoken';
import { JwtClientSystemGuard } from './jwt-client-system.guard';

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const { publicKey: otherPublicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

function signToken(issuer: string): string {
  return jwt.sign({}, privateKey, { algorithm: 'RS256', issuer });
}

function buildContext(authorization?: string) {
  const request: Record<string, unknown> = {
    headers: authorization ? { authorization } : {},
  };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtClientSystemGuard', () => {
  const clientSystem = {
    id: 1,
    code: 'ISSUER_A',
    name: 'Sistema A',
    publicKey,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let prisma: {
    clientSystem: { findFirst: jest.Mock };
    errorCategory: { findUnique: jest.Mock };
    transactionError: { create: jest.Mock };
  };
  let guard: JwtClientSystemGuard;

  beforeEach(() => {
    prisma = {
      clientSystem: { findFirst: jest.fn() },
      errorCategory: { findUnique: jest.fn().mockResolvedValue({ id: 99, code: 'AUTH' }) },
      transactionError: { create: jest.fn().mockResolvedValue({}) },
    };
    guard = new JwtClientSystemGuard(prisma as never);
  });

  it('rejects requests without an Authorization header', async () => {
    const context = buildContext();

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.transactionError.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          transactionId: null,
          errorCategoryId: 99,
        }),
      }),
    );
  });

  it('rejects a token without iss claim', async () => {
    const token = jwt.sign({}, privateKey, { algorithm: 'RS256' });
    const context = buildContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.clientSystem.findFirst).not.toHaveBeenCalled();
  });

  it('rejects when no active client system matches the issuer', async () => {
    prisma.clientSystem.findFirst.mockResolvedValue(null);
    const token = signToken('UNKNOWN_ISSUER');
    const context = buildContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.clientSystem.findFirst).toHaveBeenCalledWith({
      where: { code: 'UNKNOWN_ISSUER', isActive: true },
    });
  });

  it('rejects when the signature does not match the stored public key', async () => {
    prisma.clientSystem.findFirst.mockResolvedValue({
      ...clientSystem,
      publicKey: otherPublicKey,
    });
    const token = signToken(clientSystem.code);
    const context = buildContext(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('attaches the client system to the request when the token is valid', async () => {
    prisma.clientSystem.findFirst.mockResolvedValue(clientSystem);
    const token = signToken(clientSystem.code);
    const request: Record<string, unknown> = {
      headers: { authorization: `Bearer ${token}` },
    };
    const context = {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request['clientSystem']).toEqual(clientSystem);
    expect(prisma.transactionError.create).not.toHaveBeenCalled();
  });
});
