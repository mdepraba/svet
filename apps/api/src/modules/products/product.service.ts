import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

/** Category, tax and on-hand stock — the columns the product catalog shows. */
const productInclude = {
  productCategory: { select: { id: true, name: true, type: true } },
  tax: { select: { id: true, name: true, rate: true } },
  productStocks: { select: { totalQty: true } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

/** Flattens the one-row `productStocks` relation into a single number. */
function toListItem(product: ProductRow) {
  const { productStocks, ...rest } = product;
  return { ...rest, stock: productStocks[0]?.totalQty ?? null };
}

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: productInclude,
    });

    return toListItem(product);
  }

  async findAll(
    paginationDto: PaginationDto & { type?: 'MEDIC' | 'NON_MEDIC' },
  ) {
    const { search, type } = paginationDto;

    const whereCondition: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(type && { productCategory: { type } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const page = await paginate(
      this.prisma.product,
      { where: whereCondition, include: productInclude },
      paginationDto,
    );

    return { ...page, data: page.data.map(toListItem) };
  }

  async findForBackup() {
    return await this.prisma.product.findMany({
      include: productInclude,
    });
  }

  async create(input: CreateProductDto) {
    return await this.prisma.product.create({ data: input });
  }

  async createMany(inputs: CreateProductDto[]) {
    return await this.prisma.product.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateProductDto) {
    return await this.prisma.product.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.product.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.product.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.product.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
