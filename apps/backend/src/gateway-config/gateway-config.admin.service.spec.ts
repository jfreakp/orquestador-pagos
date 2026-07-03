import { ConflictException, NotFoundException } from '@nestjs/common';
import { EncryptionService } from '../common/encryption.service';
import { GatewayConfigService } from './gateway-config.service';

describe('GatewayConfigService (admin CRUD)', () => {
  let prisma: {
    gatewayConfig: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    gateway: { findUnique: jest.Mock };
    channel: { findUnique: jest.Mock };
  };
  let encryptionService: { encrypt: jest.Mock; decrypt: jest.Mock };
  let service: GatewayConfigService;

  const row = {
    id: 1,
    gatewayId: 10,
    channelId: 20,
    isActive: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    prisma = {
      gatewayConfig: {
        findMany: jest.fn().mockResolvedValue([row]),
        count: jest.fn().mockResolvedValue(1),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      gateway: { findUnique: jest.fn() },
      channel: { findUnique: jest.fn() },
    };
    encryptionService = {
      encrypt: jest.fn().mockReturnValue(Buffer.from('encrypted')),
      decrypt: jest.fn(),
    };
    service = new GatewayConfigService(
      prisma as never,
      encryptionService as unknown as EncryptionService,
    );
  });

  it('findAllAdmin never leaks credentials, only hasCredentials', async () => {
    const result = await service.findAllAdmin();

    expect(result.items).toEqual([
      {
        id: 1,
        gatewayId: 10,
        channelId: 20,
        isActive: true,
        hasCredentials: true,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    ]);
  });

  it('findByIdAdmin throws NotFoundException when missing', async () => {
    prisma.gatewayConfig.findUnique.mockResolvedValue(null);

    await expect(service.findByIdAdmin(99)).rejects.toThrow(NotFoundException);
  });

  it('createAdmin encrypts credentialsPlain and returns a summary without credentials', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 10, code: 'PLACETOPAY' });
    prisma.channel.findUnique.mockResolvedValue({ id: 20, code: 'WEB' });
    prisma.gatewayConfig.findUnique.mockResolvedValue(null); // no existing config
    prisma.gatewayConfig.create.mockResolvedValue(row);

    const result = await service.createAdmin({
      gatewayCode: 'PLACETOPAY',
      channelCode: 'WEB',
      credentialsPlain: { login: 'a', secretKey: 'b' },
    });

    expect(encryptionService.encrypt).toHaveBeenCalledWith({
      login: 'a',
      secretKey: 'b',
    });
    expect(prisma.gatewayConfig.create).toHaveBeenCalledWith({
      data: {
        gatewayId: 10,
        channelId: 20,
        credentials: Buffer.from('encrypted'),
        isActive: true,
      },
    });
    expect(result).not.toHaveProperty('credentials');
    expect(result.hasCredentials).toBe(true);
  });

  it('createAdmin throws ConflictException when a config already exists for that gateway+channel', async () => {
    prisma.gateway.findUnique.mockResolvedValue({ id: 10, code: 'PLACETOPAY' });
    prisma.channel.findUnique.mockResolvedValue({ id: 20, code: 'WEB' });
    prisma.gatewayConfig.findUnique.mockResolvedValue(row);

    await expect(
      service.createAdmin({
        gatewayCode: 'PLACETOPAY',
        channelCode: 'WEB',
        credentialsPlain: { login: 'a', secretKey: 'b' },
      }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.gatewayConfig.create).not.toHaveBeenCalled();
  });

  it('updateAdmin re-encrypts credentialsPlain only when provided', async () => {
    prisma.gatewayConfig.findUnique.mockResolvedValue(row);
    prisma.gatewayConfig.update.mockResolvedValue({ ...row, isActive: false });

    const result = await service.updateAdmin(1, { isActive: false });

    expect(encryptionService.encrypt).not.toHaveBeenCalled();
    expect(prisma.gatewayConfig.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { isActive: false },
    });
    expect(result.isActive).toBe(false);
  });

  it('removeAdmin deletes after confirming existence', async () => {
    prisma.gatewayConfig.findUnique.mockResolvedValue(row);

    await service.removeAdmin(1);

    expect(prisma.gatewayConfig.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
