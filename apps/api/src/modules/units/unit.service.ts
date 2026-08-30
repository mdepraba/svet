import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class UnitService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.unit.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.UnitWhereInput = search
      ? {
          deletedAt: null,
          OR: [{ name: { startsWith: search, mode: 'insensitive' } }],
        }
      : { deletedAt: null };

    return paginate(this.prisma.unit, { where: whereCondition }, paginationDto);
  }

  async findForBackup() {
    return await this.prisma.unit.findMany({});
  }

  async create(input: CreateUnitDto) {
    return await this.prisma.unit.create({ data: input });
  }

  async createMany(inputs: CreateUnitDto[]) {
    return await this.prisma.unit.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateUnitDto) {
    return await this.prisma.unit.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.unit.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.unit.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.unit.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.unit.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
