import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateOwnerDto, UpdateOwnerDto } from './dto/owner.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

const patientSelect = {
  id: true,
  name: true,
  species: true,
  breed: true,
  dob: true,
} satisfies Prisma.PatientSelect;

/** The list needs the owner's pets and the date they were last in. */
const ownerListInclude = {
  patients: { where: { deletedAt: null }, select: patientSelect },
  visits: {
    where: { deletedAt: null },
    select: { visitDate: true },
    orderBy: { visitDate: 'desc' as const },
    take: 1,
  },
} satisfies Prisma.OwnerInclude;

/** The detail screen adds their visit and invoice history. */
const ownerDetailInclude = {
  patients: { where: { deletedAt: null }, select: patientSelect },
  visits: {
    where: { deletedAt: null },
    select: {
      id: true,
      visitDate: true,
      status: true,
      visitType: true,
      visitDetails: {
        where: { deletedAt: null },
        select: { patient: { select: { id: true, name: true } } },
      },
    },
    orderBy: { visitDate: 'desc' as const },
    take: 20,
  },
  invoices: {
    where: { deletedAt: null },
    select: {
      id: true,
      identifier: true,
      status: true,
      totalGross: true,
      createdAt: true,
      visitId: true,
    },
    orderBy: { createdAt: 'desc' as const },
    take: 20,
  },
} satisfies Prisma.OwnerInclude;

type OwnerListRow = Prisma.OwnerGetPayload<{
  include: typeof ownerListInclude;
}>;
type OwnerDetailRow = Prisma.OwnerGetPayload<{
  include: typeof ownerDetailInclude;
}>;

function toListItem(owner: OwnerListRow) {
  const { visits, ...rest } = owner;
  return { ...rest, lastVisitAt: visits[0]?.visitDate ?? null };
}

function toDetail(owner: OwnerDetailRow) {
  return {
    ...owner,
    lastVisitAt: owner.visits[0]?.visitDate ?? null,
    // One visit can cover several pets; the client shows them as one column.
    visits: owner.visits.map(({ visitDetails, ...visit }) => ({
      ...visit,
      patients: visitDetails.map((detail) => detail.patient),
    })),
  };
}

@Injectable()
export class OwnerService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const owner = await this.prisma.owner.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: ownerDetailInclude,
    });

    return toDetail(owner);
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.OwnerWhereInput = {
      deletedAt: null,
      // `contains`, not `startsWith` — the design's placeholder promises a
      // search across name, email and phone, and a phone number is rarely
      // remembered from its first digit.
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const page = await paginate(
      this.prisma.owner,
      { where: whereCondition, include: ownerListInclude },
      paginationDto,
    );

    return { ...page, data: page.data.map(toListItem) };
  }

  async findForBackup() {
    return await this.prisma.owner.findMany({ include: ownerListInclude });
  }

  async create(input: CreateOwnerDto) {
    return await this.prisma.owner.create({ data: input });
  }

  async createMany(inputs: CreateOwnerDto[]) {
    return await this.prisma.owner.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateOwnerDto) {
    return await this.prisma.owner.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    return await this.prisma.owner.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeMany(ids: string[]) {
    return await this.prisma.owner.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return await this.prisma.owner.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.owner.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.owner.delete({ where: { id } });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.owner.deleteMany({ where: { id: { in: ids } } });
  }
}
