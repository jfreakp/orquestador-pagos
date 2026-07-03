import { Injectable } from '@nestjs/common';
import { Gateway, Prisma, PrismaService } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class GatewaysService extends BaseCatalogService<
  Gateway,
  Prisma.GatewayCreateInput,
  Prisma.GatewayUpdateInput
> {
  protected readonly entityName = 'Gateway';
  protected readonly delegate: CrudDelegate<
    Gateway,
    Prisma.GatewayCreateInput,
    Prisma.GatewayUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.gateway;
  }
}
