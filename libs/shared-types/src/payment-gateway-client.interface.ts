import { CreatePaymentInput } from './create-payment-input.type.js';
import { GatewayPaymentResult } from './gateway-payment-result.type.js';

export interface PaymentGatewayClient {
  createPayment(input: CreatePaymentInput): Promise<GatewayPaymentResult>;
  queryStatus?(externalReference: string): Promise<GatewayPaymentResult>;
}
