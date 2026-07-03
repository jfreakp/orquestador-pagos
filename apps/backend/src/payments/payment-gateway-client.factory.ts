import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import { PaymentGatewayClient } from '@orquestador/shared-types';

export const PAYMENT_GATEWAY_CLIENTS = 'PAYMENT_GATEWAY_CLIENTS';

export interface PaymentGatewayClientRegistration {
  gatewayCode: string;
  client: PaymentGatewayClient;
}

@Injectable()
export class PaymentGatewayClientFactory {
  constructor(
    @Inject(PAYMENT_GATEWAY_CLIENTS)
    private readonly registrations: PaymentGatewayClientRegistration[],
  ) {}

  getClient(gatewayCode: string): PaymentGatewayClient {
    const registration = this.registrations.find(
      (entry) => entry.gatewayCode === gatewayCode,
    );
    if (!registration) {
      throw new NotImplementedException(
        `Gateway '${gatewayCode}' no tiene implementación registrada todavía`,
      );
    }
    return registration.client;
  }
}
