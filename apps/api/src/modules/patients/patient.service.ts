import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreatePatientDto, UpdatePatientDto } from './dto/patient.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

/** Owner, last-seen date and file thickness — the patient list's own columns. */
const patientInclude = {
  owner: { select: { id: true, name: true, phone: true } },
  visitDetails: {
    where: { deletedAt: null },
    select: {
      id: true,
      visit: { select: { id: true, visitDate: true, status: true } },
    },
    orderBy: { createdAt: 'desc' as const },
    take: 1,
  },
  _count: { select: { medicalRecords: true } },
} satisfies Prisma.PatientInclude;

type PatientWithRelations = Prisma.PatientGetPayload<{
  include: typeof patientInclude;
}>;

/**
 * Flattens the two relations the client only reads one field from, so a row
 * prints `lastVisitAt` rather than walking `visitDetails[0].visit.visitDate`.
 */
function toListItem(patient: PatientWithRelations) {
  return {
    id: patient.id,
    name: patient.name,
    species: patient.species,
    breed: patient.breed,
    sex: patient.sex,
    color: patient.color,
    dob: patient.dob,
    ownerId: patient.ownerId,
    deletedAt: patient.deletedAt,
    owner: patient.owner,
    lastVisitAt: patient.visitDetails[0]?.visit?.visitDate ?? null,
    recordCount: patient._count.medicalRecords,
  };
}

@Injectable()
export class PatientService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const patient = await this.prisma.patient.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: patientInclude,
    });

    return toListItem(patient);
  }

  async findAll(paginationDto: PaginationDto & { species?: string }) {
    const { search, species } = paginationDto;

    const whereCondition: Prisma.PatientWhereInput = {
      deletedAt: null,
      ...(species && { species: { equals: species, mode: 'insensitive' } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { breed: { contains: search, mode: 'insensitive' } },
          { owner: { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    };

    const page = await paginate(
      this.prisma.patient,
      { where: whereCondition, include: patientInclude },
      paginationDto,
    );

    return { ...page, data: page.data.map(toListItem) };
  }

  async findForBackup() {
    return await this.prisma.patient.findMany({ include: patientInclude });
  }

  async create(input: CreatePatientDto) {
    return await this.prisma.patient.create({ data: input });
  }

  async createMany(inputs: CreatePatientDto[]) {
    return await this.prisma.patient.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdatePatientDto) {
    return await this.prisma.patient.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    return await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeMany(ids: string[]) {
    return await this.prisma.patient.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.patient.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.patient.delete({ where: { id } });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.patient.deleteMany({ where: { id: { in: ids } } });
  }
}
