import { Module } from '@nestjs/common';
import { EncryptionService } from '../common/encryption.service';
import { JwtClientSystemGuard } from '../common/jwt-client-system.guard';
import { QrCodeService } from '../common/qr-code.service';
import {
  PAYMENT_GATEWAY_CLIENTS,
  PaymentGatewayClientFactory,
} from './payment-gateway-client.factory';
import { PaymentOrchestrationService } from './payment-orchestration.service';
import { PaymentsController } from './payments.controller';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentOrchestrationService,
    PaymentGatewayClientFactory,
    QrCodeService,
    EncryptionService,
    JwtClientSystemGuard,
    { provide: PAYMENT_GATEWAY_CLIENTS, useValue: [] },
  ],
})
export class PaymentsModule {}
