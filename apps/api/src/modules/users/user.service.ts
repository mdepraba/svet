import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { hashPassword } from '@/common/utils/password.util';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.user.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: { role: true },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.UserWhereInput = search
      ? {
          deletedAt: null,
          OR: [{ name: { startsWith: search, mode: 'insensitive' } }],
        }
      : { deletedAt: null };

    return paginate(
      this.prisma.user,
      { where: whereCondition, include: { role: true } },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.user.findMany({
      include: { role: true },
    });
  }

  async create(input: CreateUserDto) {
    return await this.prisma.user.create({
      data: { ...input, password: await hashPassword(input.password) },
    });
  }

  async createMany(inputs: CreateUserDto[]) {
    const hashed = await Promise.all(
      inputs.map(async (input) => ({
        ...input,
        password: await hashPassword(input.password),
      })),
    );

    return await this.prisma.user.createMany({
      data: hashed,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateUserDto) {
    // A password change arrives in plain text and must not land that way.
    const data = input.password
      ? { ...input, password: await hashPassword(input.password) }
      : input;

    return await this.prisma.user.update({ where: { id }, data });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.user.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.user.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
