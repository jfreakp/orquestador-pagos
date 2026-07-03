import { Module } from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { EncryptionService } from '../common/encryption.service';
import { GatewayConfigController } from './gateway-config.controller';
import { GatewayConfigService } from './gateway-config.service';

@Module({
  controllers: [GatewayConfigController],
  providers: [GatewayConfigService, EncryptionService, AdminAuthGuard],
  exports: [GatewayConfigService],
})
export class GatewayConfigModule {}
