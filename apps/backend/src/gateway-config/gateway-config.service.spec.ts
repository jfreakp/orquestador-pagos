import { NotFoundException } from '@nestjs/common';
import { PlaceToPayCredentials } from '@orquestador/shared-types';
import { EncryptionService } from '../common/encryption.service';
import { GatewayConfigService } from './gateway-config.service';

describe('GatewayConfigService', () => {
  let prisma: {
    gatewayConfig: { findFirst: jest.Mock; upsert: jest.Mock };
    gateway: { findUnique: jest.Mock };
    channel: { findUnique: jest.Mock };
  };
  let encryptionService: {
    encrypt: jest.Mock;
    decrypt: jest.Mock;
  };
  let service: GatewayConfigService;

  const credentials: PlaceToPayCredentials = {
    login: 'login-123',
    secretKey: 'secret-abc',
  };

  beforeEach(() => {
    prisma = {
      gatewayConfig: { findFirst: jest.fn(), upsert: jest.fn() },
      gateway: { findUnique: jest.fn() },
      channel: { findUnique: jest.fn() },
    };
    encryptionService = {
      encrypt: jest.fn().mockReturnValue(Buffer.from('encrypted')),
      decrypt: jest.fn().mockReturnValue(credentials),
    };
    service = new GatewayConfigService(
      prisma as never,
      encryptionService as unknown as EncryptionService,
    );
  });

  describe('getConfig', () => {
    it('returns the decrypted credentials for an active config', async () => {
      prisma.gatewayConfig.findFirst.mockResolvedValue({
        id: 1,
        gatewayId: 10,
        channelId: 20,
        isActive: true,
        credentials: Buffer.from('encrypted'),
      });

      const result = await service.getConfig('PLACETOPAY', 'WEB');

      expect(prisma.gatewayConfig.findFirst).toHaveBeenCalledWith({
        where: {
          gateway: { code: 'PLACETOPAY' },
          channel: { code: 'WEB' },
          isActive: true,
        },
      });
      expect(encryptionService.decrypt).toHaveBeenCalledWith(
        Buffer.from('encrypted'),
      );
      expect(result).toEqual({
        id: 1,
        gatewayId: 10,
        channelId: 20,
        isActive: true,
        credentials,
      });
    });

    it('throws NotFoundException when there is no active config', async () => {
      prisma.gatewayConfig.findFirst.mockResolvedValue(null);

      await expect(service.getConfig('PLACETOPAY', 'WEB')).rejects.toThrow(
        NotFoundException,
      );
      expect(encryptionService.decrypt).not.toHaveBeenCalled();
    });
  });

  describe('saveCredentials', () => {
    it('encrypts and upserts credentials, without leaking them in the result', async () => {
      prisma.gateway.findUnique.mockResolvedValue({ id: 10, code: 'PLACETOPAY' });
      prisma.channel.findUnique.mockResolvedValue({ id: 20, code: 'WEB' });
      prisma.gatewayConfig.upsert.mockResolvedValue({});

      const result = await service.saveCredentials(
        'PLACETOPAY',
        'WEB',
        credentials,
      );

      expect(encryptionService.encrypt).toHaveBeenCalledWith(credentials);
      expect(prisma.gatewayConfig.upsert).toHaveBeenCalledWith({
        where: { gatewayId_channelId: { gatewayId: 10, channelId: 20 } },
        create: {
          gatewayId: 10,
          channelId: 20,
          credentials: Buffer.from('encrypted'),
          isActive: true,
        },
        update: { credentials: Buffer.from('encrypted') },
      });
      expect(result).toEqual({ hasCredentials: true });
    });

    it('throws NotFoundException when the gateway does not exist', async () => {
      prisma.gateway.findUnique.mockResolvedValue(null);
      prisma.channel.findUnique.mockResolvedValue({ id: 20, code: 'WEB' });

      await expect(
        service.saveCredentials('UNKNOWN', 'WEB', credentials),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.gatewayConfig.upsert).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the channel does not exist', async () => {
      prisma.gateway.findUnique.mockResolvedValue({ id: 10, code: 'PLACETOPAY' });
      prisma.channel.findUnique.mockResolvedValue(null);

      await expect(
        service.saveCredentials('PLACETOPAY', 'UNKNOWN', credentials),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.gatewayConfig.upsert).not.toHaveBeenCalled();
    });
  });
});
