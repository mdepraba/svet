import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateProductCategoryDto,
  UpdateProductCategoryDto,
} from './dto/product-category.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class ProductCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.productCategory.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.ProductCategoryWhereInput = search
      ? {
          OR: [{ name: { startsWith: search, mode: 'insensitive' } }],
        }
      : {};

    return paginate(
      this.prisma.productCategory,
      { where: whereCondition },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.productCategory.findMany({});
  }

  async create(input: CreateProductCategoryDto) {
    return await this.prisma.productCategory.create({ data: input });
  }

  async createMany(inputs: CreateProductCategoryDto[]) {
    return await this.prisma.productCategory.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateProductCategoryDto) {
    return await this.prisma.productCategory.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.productCategory.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.productCategory.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.productCategory.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.productCategory.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.productCategory.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.productCategory.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
