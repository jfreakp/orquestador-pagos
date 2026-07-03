import { Injectable } from '@nestjs/common';
import { ClientSystem, Prisma, PrismaService } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class ClientSystemsService extends BaseCatalogService<
  ClientSystem,
  Prisma.ClientSystemCreateInput,
  Prisma.ClientSystemUpdateInput
> {
  protected readonly entityName = 'ClientSystem';
  protected readonly delegate: CrudDelegate<
    ClientSystem,
    Prisma.ClientSystemCreateInput,
    Prisma.ClientSystemUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.clientSystem;
  }
}
