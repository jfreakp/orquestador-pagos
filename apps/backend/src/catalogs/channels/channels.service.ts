import { Injectable } from '@nestjs/common';
import { Channel, Prisma, PrismaService } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class ChannelsService extends BaseCatalogService<
  Channel,
  Prisma.ChannelCreateInput,
  Prisma.ChannelUpdateInput
> {
  protected readonly entityName = 'Channel';
  protected readonly delegate: CrudDelegate<
    Channel,
    Prisma.ChannelCreateInput,
    Prisma.ChannelUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.channel;
  }
}
