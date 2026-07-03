export interface TransactionListItem {
  publicId: string;
  gatewayCode: string;
  channelCode: string;
  clientSystemCode: string;
  statusCode: string;
  amount: number;
  currency: string;
  externalReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionStatusHistoryItem {
  statusCode: string;
  operationTypeCode?: string;
  note?: string;
  createdAt: string;
}

export interface TransactionDetail extends TransactionListItem {
  paymentLink?: string;
  qrCodeBase64?: string;
  statusHistory: TransactionStatusHistoryItem[];
  requestPlain?: unknown;
  responsePlain?: unknown;
  requestEncryptedBase64?: string;
  responseEncryptedBase64?: string;
}

export interface TransactionErrorListItem {
  id: number;
  transactionPublicId?: string;
  errorCategoryCode: string;
  gatewayCode?: string;
  gatewayOperationTypeCode?: string;
  message: string;
  createdAt: string;
}

export interface TransactionErrorDetail extends TransactionErrorListItem {
  details?: unknown;
}
