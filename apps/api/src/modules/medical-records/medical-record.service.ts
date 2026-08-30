import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateMedicalRecordDto,
  UpdateMedicalRecordDto,
} from './dto/medical-record.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

/** The relations the record list and detail screens render. */
const recordInclude = {
  patient: {
    select: {
      id: true,
      name: true,
      species: true,
      breed: true,
      owner: { select: { id: true, name: true } },
    },
  },
  visitDetails: {
    select: {
      id: true,
      visitId: true,
      vet: { select: { id: true, name: true } },
      visit: { select: { id: true, visitDate: true, status: true } },
      // The record screen's "Used" line covers services as well as products,
      // and services live on the visit detail rather than on the record.
      visitTreatmentAssocs: {
        where: { deletedAt: null },
        select: {
          id: true,
          qty: true,
          treatment: { select: { id: true, name: true } },
        },
      },
      visitProductAssocs: {
        where: { deletedAt: null },
        select: {
          id: true,
          qty: true,
          product: {
            select: { id: true, name: true, dispensingUnit: true },
          },
        },
      },
    },
  },
  MedicalUsages: {
    where: { deletedAt: null },
    include: {
      product: { select: { id: true, name: true, dispensingUnit: true } },
    },
  },
} satisfies Prisma.MedicalRecordInclude;

@Injectable()
export class MedicalRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.medicalRecord.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: recordInclude,
    });
  }

  /**
   * One patient's chart, newest first — the permanent history that outlives
   * any single visit. Flattened so the client reads a date and a vet name
   * rather than walking two relations.
   */
  async findForPatient(patientId: string) {
    const records = await this.prisma.medicalRecord.findMany({
      where: { patientId, deletedAt: null },
      include: recordInclude,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => ({
      id: record.id,
      visitDetailId: record.visitDetailId,
      recordedAt: record.visitDetails?.visit?.visitDate ?? record.createdAt,
      vetName: record.visitDetails?.vet?.name ?? null,
      diagnosis: record.diagnosis,
      anamnesis: record.anamnesis,
      temperature: record.temperature,
      pulse: record.pulse,
      weight: record.weight,
    }));
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.MedicalRecordWhereInput = search
      ? {
          OR: [
            {
              MedicalUsages: {
                some: {
                  product: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              },
            },
          ],
        }
      : {};

    return paginate(
      this.prisma.medicalRecord,
      { where: whereCondition, include: recordInclude },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.medicalRecord.findMany({});
  }

  async create(input: CreateMedicalRecordDto) {
    return await this.prisma.medicalRecord.create({ data: input });
  }

  async createMany(inputs: CreateMedicalRecordDto[]) {
    return await this.prisma.medicalRecord.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateMedicalRecordDto) {
    return await this.prisma.medicalRecord.update({
      where: { id },
      data: input,
    });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.medicalRecord.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.medicalRecord.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.medicalRecord.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.medicalRecord.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.medicalRecord.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
