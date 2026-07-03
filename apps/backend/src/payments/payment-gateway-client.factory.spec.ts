import { NotImplementedException } from '@nestjs/common';
import { PaymentGatewayClient } from '@orquestador/shared-types';
import {
  PaymentGatewayClientFactory,
  PaymentGatewayClientRegistration,
} from './payment-gateway-client.factory';

describe('PaymentGatewayClientFactory', () => {
  const ahoritaClient: PaymentGatewayClient = {
    createPayment: jest.fn(),
  };

  const registrations: PaymentGatewayClientRegistration[] = [
    { gatewayCode: 'AHORITA', client: ahoritaClient },
  ];

  it('returns the registered client for a known gateway code', () => {
    const factory = new PaymentGatewayClientFactory(registrations);

    expect(factory.getClient('AHORITA')).toBe(ahoritaClient);
  });

  it('throws NotImplementedException with a clear message for an unregistered gateway', () => {
    const factory = new PaymentGatewayClientFactory(registrations);

    expect(() => factory.getClient('DEUNA')).toThrow(NotImplementedException);
    expect(() => factory.getClient('DEUNA')).toThrow(
      "Gateway 'DEUNA' no tiene implementación registrada todavía",
    );
  });

  it('throws when there are no registrations at all', () => {
    const factory = new PaymentGatewayClientFactory([]);

    expect(() => factory.getClient('AHORITA')).toThrow(
      NotImplementedException,
    );
  });
});
