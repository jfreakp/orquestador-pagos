import { Injectable } from '@nestjs/common';
import { ErrorCategory, Prisma, PrismaService } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from '../base-catalog.service';

@Injectable()
export class ErrorCategoriesService extends BaseCatalogService<
  ErrorCategory,
  Prisma.ErrorCategoryCreateInput,
  Prisma.ErrorCategoryUpdateInput
> {
  protected readonly entityName = 'ErrorCategory';
  protected readonly delegate: CrudDelegate<
    ErrorCategory,
    Prisma.ErrorCategoryCreateInput,
    Prisma.ErrorCategoryUpdateInput
  >;

  constructor(prisma: PrismaService) {
    super();
    this.delegate = prisma.errorCategory;
  }
}
