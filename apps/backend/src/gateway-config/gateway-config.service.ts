import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@orquestador/prisma';
import { GatewayCredentials } from '@orquestador/shared-types';
import { EncryptionService } from '../common/encryption.service';
import { PaginatedResult } from '../catalogs/base-catalog.service';
import { CreateGatewayConfigDto } from './dto/create-gateway-config.dto';
import { UpdateGatewayConfigDto } from './dto/update-gateway-config.dto';

export interface ResolvedGatewayConfig {
  id: number;
  gatewayId: number;
  channelId: number;
  isActive: boolean;
  credentials: GatewayCredentials;
}

// Nunca se expone el campo `credentials` cifrado por la API de
// administración: solo se confirma su existencia con hasCredentials.
export interface GatewayConfigSummary {
  id: number;
  gatewayId: number;
  channelId: number;
  isActive: boolean;
  hasCredentials: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

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

  async findAllAdmin(
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<GatewayConfigSummary>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.prisma.gatewayConfig.findMany({
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { id: 'asc' },
      }),
      this.prisma.gatewayConfig.count(),
    ]);

    return {
      items: items.map((item) => this.toSummary(item)),
      total,
      page: safePage,
      pageSize: safePageSize,
    };
  }

  async findByIdAdmin(id: number): Promise<GatewayConfigSummary> {
    const config = await this.prisma.gatewayConfig.findUnique({
      where: { id },
    });
    if (!config) {
      throw new NotFoundException(`GatewayConfig not found: ${id}`);
    }
    return this.toSummary(config);
  }

  async createAdmin(
    dto: CreateGatewayConfigDto,
  ): Promise<GatewayConfigSummary> {
    const [gateway, channel] = await Promise.all([
      this.prisma.gateway.findUnique({ where: { code: dto.gatewayCode } }),
      this.prisma.channel.findUnique({ where: { code: dto.channelCode } }),
    ]);
    if (!gateway) {
      throw new NotFoundException(`Unknown gateway: ${dto.gatewayCode}`);
    }
    if (!channel) {
      throw new NotFoundException(`Unknown channel: ${dto.channelCode}`);
    }

    const existing = await this.prisma.gatewayConfig.findUnique({
      where: {
        gatewayId_channelId: { gatewayId: gateway.id, channelId: channel.id },
      },
    });
    if (existing) {
      throw new ConflictException(
        `GatewayConfig already exists for gateway=${dto.gatewayCode} channel=${dto.channelCode}`,
      );
    }

    const created = await this.prisma.gatewayConfig.create({
      data: {
        gatewayId: gateway.id,
        channelId: channel.id,
        credentials: this.encryptionService.encrypt(dto.credentialsPlain),
        isActive: dto.isActive ?? true,
      },
    });

    return this.toSummary(created);
  }

  async updateAdmin(
    id: number,
    dto: UpdateGatewayConfigDto,
  ): Promise<GatewayConfigSummary> {
    await this.findByIdAdmin(id);

    const updated = await this.prisma.gatewayConfig.update({
      where: { id },
      data: {
        ...(dto.credentialsPlain !== undefined
          ? { credentials: this.encryptionService.encrypt(dto.credentialsPlain) }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    return this.toSummary(updated);
  }

  async removeAdmin(id: number): Promise<void> {
    await this.findByIdAdmin(id);
    await this.prisma.gatewayConfig.delete({ where: { id } });
  }

  private toSummary(config: {
    id: number;
    gatewayId: number;
    channelId: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): GatewayConfigSummary {
    return {
      id: config.id,
      gatewayId: config.gatewayId,
      channelId: config.channelId,
      isActive: config.isActive,
      // La columna `credentials` es NOT NULL: toda fila persistida ya tiene
      // credenciales. El flag existe para nunca exponer los bytes cifrados.
      hasCredentials: true,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  }
}
