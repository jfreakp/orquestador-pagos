import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { GatewayOperationType } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { CreateGatewayOperationTypeDto } from './dto/create-gateway-operation-type.dto';
import { UpdateGatewayOperationTypeDto } from './dto/update-gateway-operation-type.dto';
import { GatewayOperationTypesService } from './gateway-operation-types.service';

@Controller('gateway-operation-types')
export class GatewayOperationTypesController extends BaseCatalogController<
  GatewayOperationType,
  CreateGatewayOperationTypeDto,
  UpdateGatewayOperationTypeDto
> {
  constructor(protected readonly service: GatewayOperationTypesService) {
    super();
  }

  @Post()
  create(@Body() dto: CreateGatewayOperationTypeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGatewayOperationTypeDto,
  ) {
    return this.service.update(id, dto);
  }
}
