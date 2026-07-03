import { Body, Controller, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { ErrorCategory } from '@orquestador/prisma';
import { BaseCatalogController } from '../base-catalog.controller';
import { CreateErrorCategoryDto } from './dto/create-error-category.dto';
import { UpdateErrorCategoryDto } from './dto/update-error-category.dto';
import { ErrorCategoriesService } from './error-categories.service';

@Controller('error-categories')
export class ErrorCategoriesController extends BaseCatalogController<
  ErrorCategory,
  CreateErrorCategoryDto,
  UpdateErrorCategoryDto
> {
  constructor(protected readonly service: ErrorCategoriesService) {
    super();
  }

  @Post()
  create(@Body() dto: CreateErrorCategoryDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateErrorCategoryDto,
  ) {
    return this.service.update(id, dto);
  }
}
