import {
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../common/admin-auth.guard';
import { BaseCatalogService } from './base-catalog.service';

// NOTA: create()/update() (los únicos métodos con @Body()) NO viven aquí a
// propósito. TypeScript borra los parámetros de tipo genérico a `Object` al
// compilar, y `ValidationPipe` de Nest omite la validación cuando el
// metatype resuelto es `Object` — con un DTO genérico, class-validator
// nunca se ejecuta. Cada controller concreto declara su propio create/update
// con el DTO real para que la validación funcione.
@UseGuards(AdminAuthGuard)
export abstract class BaseCatalogController<
  TEntity extends { id: number },
  TCreateDto,
  TUpdateDto,
> {
  protected abstract readonly service: BaseCatalogService<
    TEntity,
    TCreateDto,
    TUpdateDto
  >;

  @Get()
  findAll(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    return this.service.findAll(
      page !== undefined ? Number(page) : undefined,
      pageSize !== undefined ? Number(pageSize) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.service.remove(id);
  }
}
