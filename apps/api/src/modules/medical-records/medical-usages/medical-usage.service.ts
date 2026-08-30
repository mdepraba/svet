import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateMedicalUsageDto,
  UpdateMedicalUsageDto,
} from './dto/medical-usage.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class MedicalUsageService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.medicalUsage.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.MedicalUsageWhereInput = search
      ? {
          OR: [
            { product: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    return paginate(
      this.prisma.medicalUsage,
      { where: whereCondition },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.medicalUsage.findMany({});
  }

  async create(input: CreateMedicalUsageDto) {
    return await this.prisma.medicalUsage.create({ data: input });
  }

  async createMany(inputs: CreateMedicalUsageDto[]) {
    return await this.prisma.medicalUsage.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateMedicalUsageDto) {
    return await this.prisma.medicalUsage.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.medicalUsage.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.medicalUsage.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.medicalUsage.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.medicalUsage.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.medicalUsage.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.medicalUsage.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
