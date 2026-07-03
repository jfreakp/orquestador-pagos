import { Module } from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { ChannelsController } from './channels/channels.controller';
import { ChannelsService } from './channels/channels.service';
import { ClientSystemsController } from './client-systems/client-systems.controller';
import { ClientSystemsService } from './client-systems/client-systems.service';
import { ErrorCategoriesController } from './error-categories/error-categories.controller';
import { ErrorCategoriesService } from './error-categories/error-categories.service';
import { GatewayOperationTypesController } from './gateway-operation-types/gateway-operation-types.controller';
import { GatewayOperationTypesService } from './gateway-operation-types/gateway-operation-types.service';
import { GatewaysController } from './gateways/gateways.controller';
import { GatewaysService } from './gateways/gateways.service';
import { TransactionStatusesController } from './transaction-statuses/transaction-statuses.controller';
import { TransactionStatusesService } from './transaction-statuses/transaction-statuses.service';

@Module({
  controllers: [
    GatewaysController,
    ChannelsController,
    TransactionStatusesController,
    GatewayOperationTypesController,
    ErrorCategoriesController,
    ClientSystemsController,
  ],
  providers: [
    AdminAuthGuard,
    GatewaysService,
    ChannelsService,
    TransactionStatusesService,
    GatewayOperationTypesService,
    ErrorCategoriesService,
    ClientSystemsService,
  ],
})
export class CatalogsModule {}
