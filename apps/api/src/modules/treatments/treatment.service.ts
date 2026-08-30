import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { CreateTreatmentDto, UpdateTreatmentDto } from './dto/treatment.dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';

/** A treatment plus its default product recipe and its pricing references. */
const treatmentInclude = {
  treatmentCategory: { select: { id: true, name: true, type: true } },
  tax: { select: { id: true, name: true, rate: true } },
  treatmentProductAssocs: {
    where: { deletedAt: null },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          dispensingUnit: true,
          grossPrice: true,
        },
      },
    },
  },
} satisfies Prisma.TreatmentInclude;

@Injectable()
export class TreatmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    return await this.prisma.treatment.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: treatmentInclude,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.TreatmentWhereInput = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    return paginate(
      this.prisma.treatment,
      { where: whereCondition, include: treatmentInclude },
      paginationDto,
    );
  }

  /**
   * Replaces a treatment's default product recipe. Existing lines are
   * soft-deleted rather than dropped so a costing history survives the edit.
   */
  async saveRecipe(id: string, lines: { productId: string; qty: number }[]) {
    await this.prisma.$transaction(async (tx) => {
      await tx.treatmentProductAssoc.updateMany({
        where: { treatmentId: id, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      if (lines.length > 0) {
        await tx.treatmentProductAssoc.createMany({
          data: lines.map((line) => ({
            treatmentId: id,
            productId: line.productId,
            qty: line.qty,
          })),
        });
      }
    });

    return await this.findOne(id);
  }

  async findForBackup() {
    return await this.prisma.treatment.findMany({
      include: treatmentInclude,
    });
  }

  async create(input: CreateTreatmentDto) {
    return await this.prisma.treatment.create({ data: input });
  }

  async createMany(inputs: CreateTreatmentDto[]) {
    return await this.prisma.treatment.createMany({
      data: inputs,
      skipDuplicates: true,
    });
  }

  async update(id: string, input: UpdateTreatmentDto) {
    return await this.prisma.treatment.update({ where: { id }, data: input });
  }

  async remove(id: string) {
    const now = new Date();

    return await this.prisma.treatment.update({
      where: { id },
      data: {
        deletedAt: now,
      },
    });
  }

  async removeMany(ids: string[]) {
    const now = new Date();

    return await this.prisma.treatment.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: {
        deletedAt: now,
      },
    });
  }

  async restore(id: string) {
    return await this.prisma.treatment.update({
      where: { id },
      data: {
        deletedAt: null,
      },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.treatment.delete({
      where: { id },
    });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.treatment.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.treatment.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: {
        deletedAt: null,
      },
    });
  }
}
