import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@orquestador/prisma';
import { BaseCatalogService, CrudDelegate } from './base-catalog.service';

interface FakeEntity {
  id: number;
  name: string;
}

class FakeCatalogService extends BaseCatalogService<
  FakeEntity,
  { name: string },
  { name?: string }
> {
  protected readonly entityName = 'FakeEntity';
  constructor(protected readonly delegate: CrudDelegate<
    FakeEntity,
    { name: string },
    { name?: string }
  >) {
    super();
  }
}

describe('BaseCatalogService', () => {
  let delegate: {
    findMany: jest.Mock;
    count: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let service: FakeCatalogService;

  beforeEach(() => {
    delegate = {
      findMany: jest.fn().mockResolvedValue([{ id: 1, name: 'a' }]),
      count: jest.fn().mockResolvedValue(1),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    service = new FakeCatalogService(delegate);
  });

  it('paginates with sane defaults', async () => {
    const result = await service.findAll();

    expect(delegate.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { id: 'asc' },
    });
    expect(result).toEqual({ items: [{ id: 1, name: 'a' }], total: 1, page: 1, pageSize: 20 });
  });

  it('clamps pageSize to the maximum and computes skip from page', async () => {
    await service.findAll(3, 500);

    expect(delegate.findMany).toHaveBeenCalledWith({
      skip: 200,
      take: 100,
      orderBy: { id: 'asc' },
    });
  });

  it('falls back to defaults for invalid page/pageSize', async () => {
    await service.findAll(-5, 0);

    expect(delegate.findMany).toHaveBeenCalledWith({
      skip: 0,
      take: 20,
      orderBy: { id: 'asc' },
    });
  });

  it('findById throws NotFoundException when missing', async () => {
    delegate.findUnique.mockResolvedValue(null);

    await expect(service.findById(99)).rejects.toThrow(NotFoundException);
  });

  it('findById returns the entity when present', async () => {
    delegate.findUnique.mockResolvedValue({ id: 1, name: 'a' });

    await expect(service.findById(1)).resolves.toEqual({ id: 1, name: 'a' });
  });

  it('create delegates directly', async () => {
    delegate.create.mockResolvedValue({ id: 2, name: 'b' });

    const result = await service.create({ name: 'b' });

    expect(delegate.create).toHaveBeenCalledWith({ data: { name: 'b' } });
    expect(result).toEqual({ id: 2, name: 'b' });
  });

  it('maps a unique constraint violation on create to ConflictException', async () => {
    delegate.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['code'] },
      }),
    );

    await expect(service.create({ name: 'dup' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('maps a unique constraint violation on update to ConflictException', async () => {
    delegate.findUnique.mockResolvedValue({ id: 1, name: 'a' });
    delegate.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: '7.8.0',
        meta: { target: ['code'] },
      }),
    );

    await expect(service.update(1, { name: 'dup' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('update checks existence before delegating', async () => {
    delegate.findUnique.mockResolvedValue({ id: 1, name: 'a' });
    delegate.update.mockResolvedValue({ id: 1, name: 'updated' });

    const result = await service.update(1, { name: 'updated' });

    expect(delegate.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: 'updated' },
    });
    expect(result).toEqual({ id: 1, name: 'updated' });
  });

  it('update throws NotFoundException without calling update when missing', async () => {
    delegate.findUnique.mockResolvedValue(null);

    await expect(service.update(99, { name: 'x' })).rejects.toThrow(
      NotFoundException,
    );
    expect(delegate.update).not.toHaveBeenCalled();
  });

  it('remove checks existence before deleting', async () => {
    delegate.findUnique.mockResolvedValue({ id: 1, name: 'a' });

    await service.remove(1);

    expect(delegate.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('remove throws NotFoundException without deleting when missing', async () => {
    delegate.findUnique.mockResolvedValue(null);

    await expect(service.remove(99)).rejects.toThrow(NotFoundException);
    expect(delegate.delete).not.toHaveBeenCalled();
  });
});
