import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateVisitProductAssocDto,
  UpdateVisitProductAssocDto,
} from './dto/visit-product-assoc.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';

@Injectable()
export class VisitProductAssocService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.visitProductAssoc.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    return paginate(
      this.prisma.visitProductAssoc,
      { where: { deletedAt: null }, include: { product: true } },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.visitProductAssoc.findMany({});
  }

  async create(input: CreateVisitProductAssocDto) {
    return await this.prisma.visitProductAssoc.create({
      data: input,
    });
  }

  async createMany(inputs: CreateVisitProductAssocDto[]) {
    return await this.prisma.visitProductAssoc.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateVisitProductAssocDto) {
    return await this.prisma.visitProductAssoc.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.visitProductAssoc.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.visitProductAssoc.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.visitProductAssoc.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.visitProductAssoc.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.visitProductAssoc.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.visitProductAssoc.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
