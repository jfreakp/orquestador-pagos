export interface PaymentResponseDto {
  publicId: string;
  status: string;
  amount: number;
  currency: string;
  paymentLink?: string;
  externalReference?: string;
  qrCodeBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}
