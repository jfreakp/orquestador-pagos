import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { GatewayAuthClient } from '@orquestador/shared-types';

export const GATEWAY_AUTH_CLIENTS = 'GATEWAY_AUTH_CLIENTS';

export interface GatewayAuthClientRegistration {
  gatewayCode: string;
  client: GatewayAuthClient;
}

@Injectable()
export class GatewayAuthClientFactory {
  constructor(
    @Inject(GATEWAY_AUTH_CLIENTS)
    private readonly registrations: GatewayAuthClientRegistration[],
  ) {}

  resolve(gatewayCode: string): GatewayAuthClient {
    const registration = this.registrations.find(
      (entry) => entry.gatewayCode === gatewayCode,
    );
    if (!registration) {
      throw new NotFoundException(
        `No GatewayAuthClient registered for gateway: ${gatewayCode}`,
      );
    }
    return registration.client;
  }
}
