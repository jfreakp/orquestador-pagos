import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@orquestador/prisma';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { AdminAuthService } from './admin-auth.service';

const SECRET = 'test-secret';

describe('AdminAuthService', () => {
  function buildService(admin: unknown) {
    const prisma = {
      admin: { findUnique: jest.fn().mockResolvedValue(admin) },
    } as unknown as PrismaService;
    const configService = {
      get: jest.fn().mockReturnValue(SECRET),
    } as unknown as ConfigService;
    return new AdminAuthService(prisma, configService);
  }

  it('returns a signed JWT when the credentials are valid', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const service = buildService({
      id: 1,
      username: 'admin',
      passwordHash,
      isActive: true,
    });

    const result = await service.login('admin', 'correct-password');

    expect(result.username).toBe('admin');
    const decoded = jwt.verify(result.accessToken, SECRET) as {
      sub: number;
      username: string;
    };
    expect(decoded.sub).toBe(1);
    expect(decoded.username).toBe('admin');
  });

  it('rejects when the username does not exist', async () => {
    const service = buildService(null);

    await expect(service.login('ghost', 'whatever')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when the admin is inactive', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const service = buildService({
      id: 1,
      username: 'admin',
      passwordHash,
      isActive: false,
    });

    await expect(
      service.login('admin', 'correct-password'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the password does not match', async () => {
    const passwordHash = await bcrypt.hash('correct-password', 4);
    const service = buildService({
      id: 1,
      username: 'admin',
      passwordHash,
      isActive: true,
    });

    await expect(service.login('admin', 'wrong-password')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
