import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateTreatmentCategoryDto,
  UpdateTreatmentCategoryDto,
} from './dto/treatment-category.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class TreatmentCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.treatmentCategory.findUniqueOrThrow({
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
    return await this.prisma.treatmentCategory.findMany({});
  }

  async create(input: CreateTreatmentCategoryDto) {
    return await this.prisma.treatmentCategory.create({ data: input });
  }

  async createMany(inputs: CreateTreatmentCategoryDto[]) {
    return await this.prisma.treatmentCategory.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateTreatmentCategoryDto) {
    return await this.prisma.treatmentCategory.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.treatmentCategory.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.treatmentCategory.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.treatmentCategory.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.treatmentCategory.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.treatmentCategory.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    const treatmentCategory = this.prisma
      .treatmentCategory as Prisma.TreatmentCategoryDelegate<any>;

    return await treatmentCategory.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
