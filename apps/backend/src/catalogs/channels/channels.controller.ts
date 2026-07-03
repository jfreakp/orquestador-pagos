import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Channel } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { ChannelsService } from './channels.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
export class ChannelsController extends BaseCatalogController<
  Channel,
  CreateChannelDto,
  UpdateChannelDto
> {
  constructor(protected readonly service: ChannelsService) {
    super();
  }

  @Post()
  create(@Body() dto: CreateChannelDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateChannelDto) {
    return this.service.update(id, dto);
  }
}
