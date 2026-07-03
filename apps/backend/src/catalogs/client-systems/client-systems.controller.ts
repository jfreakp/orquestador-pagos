import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ClientSystem } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { ClientSystemsService } from './client-systems.service';
import { CreateClientSystemDto } from './dto/create-client-system.dto';
import { UpdateClientSystemDto } from './dto/update-client-system.dto';

@Controller('client-systems')
export class ClientSystemsController extends BaseCatalogController<
  ClientSystem,
  CreateClientSystemDto,
  UpdateClientSystemDto
> {
  constructor(protected readonly service: ClientSystemsService) {
    super();
  }

  @Post()
  create(@Body() dto: CreateClientSystemDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClientSystemDto,
  ) {
    return this.service.update(id, dto);
  }
}
