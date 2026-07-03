import { Module } from '@nestjs/common';
import { EncryptionService } from '../common/encryption.service';
import {
  GATEWAY_AUTH_CLIENTS,
  GatewayAuthClientFactory,
} from './gateway-auth-client.factory';
import { GatewayAuthTokenService } from './gateway-auth-token.service';

@Module({
  providers: [
    GatewayAuthTokenService,
    GatewayAuthClientFactory,
    EncryptionService,
    { provide: GATEWAY_AUTH_CLIENTS, useValue: [] },
  ],
  exports: [GatewayAuthTokenService],
})
export class GatewayAuthTokensModule {}
