import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateVisitDetailDto } from './dto/visit-detail.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
// import { Prisma } from '@/database/prisma/generated/client';

@Injectable()
export class VisitDetailService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.visitDetail.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: { visitTreatmentAssocs: true, visitProductAssocs: true },
    });
  }

  async findAll(paginationDto: PaginationDto) {
    return paginate(
      this.prisma.visitDetail,
      {
        where: { deletedAt: null },
        include: { visitTreatmentAssocs: true, visitProductAssocs: true },
      },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.visitDetail.findMany({
      include: { visitTreatmentAssocs: true, visitProductAssocs: true },
    });
  }

  async create(input: CreateVisitDetailDto) {
    return await this.prisma.visitDetail.create({ data: input });
  }

  async createMany(inputs: CreateVisitDetailDto[]) {
    return await this.prisma.visitDetail.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  // async update(id: string, input: UpdateVisitDetailDto) {
  //   const { visitTreatmentAssocs, visitProductAssocs, visitId, patientId, vetId, ...visitDetailData } = input;
  //   if (visitTreatmentAssocs) {
  //     const existingTreatmentAssocs = await this.prisma.visitTreatmentAssoc.findMany({ where: { visitDetailId: id } });
  //     const existingTreatmentAssocIds = existingTreatmentAssocs.map((assoc) => assoc.id);

  //     const visitTreatmentAssocsIds = visitTreatmentAssocs.map((assoc) => assoc.treatmentId);
  //     const treatmentAssocsToDelete = existingTreatmentAssocIds.filter(
  //       (existingId) => !visitTreatmentAssocsIds.some((assocId) => assocId === existingId),
  //     );
  //     if (treatmentAssocsToDelete.length > 0) {
  //       await this.prisma.visitTreatmentAssoc.updateMany({
  //         where: { id: { in: treatmentAssocsToDelete } },
  //         data: { deletedAt: new Date() },
  //       });
  //     }
  //   }
  //   return await this.prisma.visitDetail.update({ where: { id }, data: visitDetailData });
  // }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.visitDetail.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.visitDetail.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.visitDetail.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.visitDetail.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    await this.prisma.medicalRecord.deleteMany({
      where: { visitDetailId: { in: ids } },
    });
    await this.prisma.visitTreatmentAssoc.deleteMany({
      where: { visitDetailId: { in: ids } },
    });
    await this.prisma.visitProductAssoc.deleteMany({
      where: { visitDetailId: { in: ids } },
    });

    return await this.prisma.visitDetail.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.visitDetail.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
