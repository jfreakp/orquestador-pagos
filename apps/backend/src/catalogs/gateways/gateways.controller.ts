import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { Gateway } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { CreateGatewayDto } from './dto/create-gateway.dto';
import { UpdateGatewayDto } from './dto/update-gateway.dto';
import { GatewaysService } from './gateways.service';

@Controller('gateways')
export class GatewaysController extends BaseCatalogController<
  Gateway,
  CreateGatewayDto,
  UpdateGatewayDto
> {
  constructor(protected readonly service: GatewaysService) {
    super();
  }

  // Declarados aquí (no en la clase base) con el DTO concreto: ver la nota
  // en BaseCatalogController sobre por qué la validación necesita el tipo
  // real y no un parámetro de tipo genérico.
  @Post()
  create(@Body() dto: CreateGatewayDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGatewayDto) {
    return this.service.update(id, dto);
  }
}
