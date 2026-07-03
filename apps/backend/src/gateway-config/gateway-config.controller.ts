import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { CreateGatewayConfigDto } from './dto/create-gateway-config.dto';
import { UpdateGatewayConfigDto } from './dto/update-gateway-config.dto';
import { GatewayConfigService } from './gateway-config.service';

@UseGuards(AdminAuthGuard)
@Controller('gateway-configs')
export class GatewayConfigController {
  constructor(private readonly gatewayConfigService: GatewayConfigService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.gatewayConfigService.findAllAdmin(
      page !== undefined ? Number(page) : undefined,
      pageSize !== undefined ? Number(pageSize) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.gatewayConfigService.findByIdAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateGatewayConfigDto) {
    return this.gatewayConfigService.createAdmin(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateGatewayConfigDto) {
    return this.gatewayConfigService.updateAdmin(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.gatewayConfigService.removeAdmin(id);
  }
}
