import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PrismaService } from '@orquestador/prisma';
import { EncryptionService } from '../common/encryption.service';
import { GatewayAuthClientFactory } from './gateway-auth-client.factory';

@Injectable()
export class GatewayAuthTokenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly authClientFactory: GatewayAuthClientFactory,
  ) {}

  async getValidAccessToken(gatewayCode: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext('gateway_token_' || ${gatewayCode}))`;

      const gateway = await tx.gateway.findUnique({
        where: { code: gatewayCode },
      });
      if (!gateway) {
        throw new NotFoundException(`Unknown gateway: ${gatewayCode}`);
      }

      const activeToken = await tx.gatewayAuthToken.findFirst({
        where: { gatewayId: gateway.id, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
      });

      if (activeToken) {
        return this.encryptionService.decrypt<string>(
          Buffer.from(activeToken.accessToken),
        );
      }

      try {
        const lastToken = await tx.gatewayAuthToken.findFirst({
          where: { gatewayId: gateway.id },
          orderBy: { createdAt: 'desc' },
        });

        const authClient = this.authClientFactory.resolve(gatewayCode);

        const result = lastToken?.refreshToken
          ? await authClient.refreshToken(
              this.encryptionService.decrypt<string>(
                Buffer.from(lastToken.refreshToken),
              ),
            )
          : await authClient.authorizeAccess();

        await tx.gatewayAuthToken.create({
          data: {
            gatewayId: gateway.id,
            accessToken: this.encryptionService.encrypt(result.accessToken),
            refreshToken: result.refreshToken
              ? this.encryptionService.encrypt(result.refreshToken)
              : null,
            expiresAt: result.expiresAt,
          },
        });

        return result.accessToken;
      } catch (error) {
        await this.registerAuthError(
          tx,
          `Failed to obtain access token for gateway: ${gatewayCode}`,
        );
        throw error;
      }
    });
  }

  private async registerAuthError(
    tx: Prisma.TransactionClient,
    message: string,
  ): Promise<void> {
    const authCategory = await tx.errorCategory.findUnique({
      where: { code: 'AUTH' },
    });
    if (!authCategory) {
      return;
    }
    await tx.transactionError.create({
      data: { transactionId: null, errorCategoryId: authCategory.id, message },
    });
  }
}
