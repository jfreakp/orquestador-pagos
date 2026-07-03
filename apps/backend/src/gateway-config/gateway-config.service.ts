import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@orquestador/prisma';
import { GatewayCredentials } from '@orquestador/shared-types';
import { EncryptionService } from '../common/encryption.service';

export interface ResolvedGatewayConfig {
  id: number;
  gatewayId: number;
  channelId: number;
  isActive: boolean;
  credentials: GatewayCredentials;
}

@Injectable()
export class GatewayConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async getConfig(
    gatewayCode: string,
    channelCode: string,
  ): Promise<ResolvedGatewayConfig> {
    const config = await this.prisma.gatewayConfig.findFirst({
      where: {
        gateway: { code: gatewayCode },
        channel: { code: channelCode },
        isActive: true,
      },
    });

    if (!config) {
      throw new NotFoundException(
        `No active gateway config for gateway=${gatewayCode} channel=${channelCode}`,
      );
    }

    const credentials = this.encryptionService.decrypt<GatewayCredentials>(
      Buffer.from(config.credentials),
    );

    return {
      id: config.id,
      gatewayId: config.gatewayId,
      channelId: config.channelId,
      isActive: config.isActive,
      credentials,
    };
  }

  async saveCredentials(
    gatewayCode: string,
    channelCode: string,
    credentials: GatewayCredentials,
  ): Promise<{ hasCredentials: boolean }> {
    const [gateway, channel] = await Promise.all([
      this.prisma.gateway.findUnique({ where: { code: gatewayCode } }),
      this.prisma.channel.findUnique({ where: { code: channelCode } }),
    ]);

    if (!gateway) {
      throw new NotFoundException(`Unknown gateway: ${gatewayCode}`);
    }
    if (!channel) {
      throw new NotFoundException(`Unknown channel: ${channelCode}`);
    }

    const encrypted = this.encryptionService.encrypt(credentials);

    await this.prisma.gatewayConfig.upsert({
      where: {
        gatewayId_channelId: {
          gatewayId: gateway.id,
          channelId: channel.id,
        },
      },
      create: {
        gatewayId: gateway.id,
        channelId: channel.id,
        credentials: encrypted,
        isActive: true,
      },
      update: {
        credentials: encrypted,
      },
    });

    return { hasCredentials: true };
  }
}
