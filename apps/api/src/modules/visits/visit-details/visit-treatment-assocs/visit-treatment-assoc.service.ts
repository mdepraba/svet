import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateVisitTreatmentAssocDto,
  UpdateVisitTreatmentAssocDto,
} from './dto/visit-treatment-assoc.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';

@Injectable()
export class VisitTreatmentAssocService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.visitTreatmentAssoc.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    return paginate(
      this.prisma.visitTreatmentAssoc,
      { where: { deletedAt: null }, include: { treatment: true } },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.visitTreatmentAssoc.findMany({});
  }

  async create(input: CreateVisitTreatmentAssocDto) {
    return await this.prisma.visitTreatmentAssoc.create({
      data: input,
    });
  }

  async createMany(inputs: CreateVisitTreatmentAssocDto[]) {
    return await this.prisma.visitTreatmentAssoc.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateVisitTreatmentAssocDto) {
    return await this.prisma.visitTreatmentAssoc.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.visitTreatmentAssoc.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.visitTreatmentAssoc.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.visitTreatmentAssoc.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.visitTreatmentAssoc.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.visitTreatmentAssoc.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.visitTreatmentAssoc.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
