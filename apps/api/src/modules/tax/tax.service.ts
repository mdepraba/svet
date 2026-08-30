import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateTaxDto, UpdateTaxDto } from './dto/tax.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.tax.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.TaxWhereInput = search
      ? {
          deletedAt: null,
          OR: [{ name: { startsWith: search, mode: 'insensitive' } }],
        }
      : { deletedAt: null };

    return paginate(this.prisma.tax, { where: whereCondition }, paginationDto);
  }

  async findForBackup() {
    return await this.prisma.tax.findMany({});
  }

  async create(input: CreateTaxDto) {
    return await this.prisma.tax.create({ data: input });
  }

  async createMany(inputs: CreateTaxDto[]) {
    return await this.prisma.tax.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateTaxDto) {
    return await this.prisma.tax.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.tax.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.tax.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.tax.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.tax.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.tax.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.tax.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
