import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class RoleService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.role.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.RoleWhereInput = search
      ? {
          deletedAt: null,
          OR: [{ name: { startsWith: search, mode: 'insensitive' } }],
        }
      : { deletedAt: null };

    return paginate(this.prisma.role, { where: whereCondition }, paginationDto);
  }

  async findForBackup() {
    return await this.prisma.role.findMany({});
  }

  async create(input: CreateRoleDto) {
    return await this.prisma.role.create({ data: input });
  }

  async createMany(inputs: CreateRoleDto[]) {
    return await this.prisma.role.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateRoleDto) {
    return await this.prisma.role.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.role.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.role.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.role.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.role.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.role.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
