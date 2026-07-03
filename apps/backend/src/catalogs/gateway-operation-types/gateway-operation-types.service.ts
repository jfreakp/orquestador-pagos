import { Injectable } from '@nestjs/common';
import {
  GatewayOperationType,
  Prisma,
  PrismaService,
} from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class GatewayOperationTypesService extends BaseCatalogService<
  GatewayOperationType,
  Prisma.GatewayOperationTypeCreateInput,
  Prisma.GatewayOperationTypeUpdateInput
> {
  protected readonly entityName = 'GatewayOperationType';
  protected readonly delegate: CrudDelegate<
    GatewayOperationType,
    Prisma.GatewayOperationTypeCreateInput,
    Prisma.GatewayOperationTypeUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.gatewayOperationType;
  }
}
