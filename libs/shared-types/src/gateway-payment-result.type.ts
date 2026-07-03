export interface GatewayPaymentResult {
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'ERROR';
  externalReference?: string;
  paymentLink?: string;
  rawRequestEncrypted?: unknown;
  rawRequestPlain?: unknown;
  rawResponseEncrypted?: unknown;
  rawResponsePlain?: unknown;
  errorCode?: string;
  errorMessage?: string;
}
