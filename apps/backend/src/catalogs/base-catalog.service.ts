import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@orquestador/prisma';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrudDelegate<TEntity, TCreateInput, TUpdateInput> {
  findMany(args: {
    skip: number;
    take: number;
    orderBy: { id: 'asc' };
  }): Promise<TEntity[]>;
  count(): Promise<number>;
  findUnique(args: { where: { id: number } }): Promise<TEntity | null>;
  create(args: { data: TCreateInput }): Promise<TEntity>;
  update(args: { where: { id: number }; data: TUpdateInput }): Promise<TEntity>;
  delete(args: { where: { id: number } }): Promise<TEntity>;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export abstract class BaseCatalogService<
  TEntity extends { id: number },
  TCreateInput,
  TUpdateInput,
> {
  protected abstract readonly delegate: CrudDelegate<
    TEntity,
    TCreateInput,
    TUpdateInput
  >;
  protected abstract readonly entityName: string;

  async findAll(
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<PaginatedResult<TEntity>> {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safePageSize =
      Number.isFinite(pageSize) && pageSize > 0
        ? Math.min(Math.floor(pageSize), MAX_PAGE_SIZE)
        : DEFAULT_PAGE_SIZE;

    const [items, total] = await Promise.all([
      this.delegate.findMany({
        skip: (safePage - 1) * safePageSize,
        take: safePageSize,
        orderBy: { id: 'asc' },
      }),
      this.delegate.count(),
    ]);

    return { items, total, page: safePage, pageSize: safePageSize };
  }

  async findById(id: number): Promise<TEntity> {
    const entity = await this.delegate.findUnique({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found: ${id}`);
    }
    return entity;
  }

  async create(data: TCreateInput): Promise<TEntity> {
    try {
      return await this.delegate.create({ data });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  async update(id: number, data: TUpdateInput): Promise<TEntity> {
    await this.findById(id);
    try {
      return await this.delegate.update({ where: { id }, data });
    } catch (error) {
      throw this.mapKnownError(error);
    }
  }

  private mapKnownError(error: unknown): unknown {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const fields = (error.meta?.['target'] as string[] | undefined)?.join(
        ', ',
      );
      return new ConflictException(
        `${this.entityName} already exists${fields ? ` (${fields})` : ''}`,
      );
    }
    return error;
  }

  async remove(id: number): Promise<void> {
    await this.findById(id);
    await this.delegate.delete({ where: { id } });
  }
}
