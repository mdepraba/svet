import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import {
  CreateVisitDto,
  SaveWorksheetDto,
  UpdateVisitDto,
  VisitQueryDto,
} from './dto/visit.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';
import { InvoiceService } from '@/modules/invoices/invoice.service';
import { InventoryService } from '@/modules/inventory/inventory.service';
import { SettingService } from '@/modules/settings/setting.service';

const namedRef = { select: { id: true, name: true } };

/** What the visit log needs per row: who, which pets, which vet, billed yet. */
const listInclude = {
  owner: namedRef,
  visitDetails: {
    where: { deletedAt: null },
    select: { id: true, patient: namedRef, vet: namedRef },
  },
  invoices: {
    where: { deletedAt: null },
    select: {
      id: true,
      identifier: true,
      status: true,
      totalGross: true,
    },
  },
} satisfies Prisma.VisitInclude;

/** Everything the worksheet edits, in one round trip. */
const worksheetInclude = {
  owner: { select: { id: true, name: true, email: true, phone: true } },
  invoices: {
    where: { deletedAt: null },
    select: { id: true, identifier: true, status: true, totalGross: true },
  },
  visitDetails: {
    where: { deletedAt: null },
    include: {
      patient: {
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          dob: true,
        },
      },
      vet: namedRef,
      medicalRecords: { where: { deletedAt: null } },
      visitTreatmentAssocs: {
        where: { deletedAt: null },
        include: {
          treatment: {
            select: {
              id: true,
              name: true,
              description: true,
              grossPrice: true,
            },
          },
        },
      },
      visitProductAssocs: {
        where: { deletedAt: null },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              dispensingUnit: true,
              grossPrice: true,
              productStocks: { select: { totalQty: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.VisitInclude;

type WorksheetVisit = Prisma.VisitGetPayload<{
  include: typeof worksheetInclude;
}>;

@Injectable()
export class VisitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoices: InvoiceService,
    private readonly inventory: InventoryService,
    private readonly settings: SettingService,
  ) {}

  /**
   * The worksheet payload. `product.stock` is flattened out of the
   * `productStocks` relation so the client reads one number rather than
   * a one-element array.
   */
  async findOne(id: string) {
    const visit = await this.prisma.visit.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: worksheetInclude,
    });

    return this.toWorksheet(visit);
  }

  private toWorksheet(visit: WorksheetVisit) {
    return {
      ...visit,
      visitDetails: visit.visitDetails.map((detail) => ({
        ...detail,
        visitProductAssocs: detail.visitProductAssocs.map((line) => ({
          ...line,
          product: {
            id: line.product.id,
            name: line.product.name,
            dispensingUnit: line.product.dispensingUnit,
            grossPrice: line.product.grossPrice,
            stock: line.product.productStocks[0]?.totalQty ?? null,
          },
        })),
      })),
    };
  }

  async findAll(query: VisitQueryDto) {
    const { search, status, date } = query;

    const whereCondition: Prisma.VisitWhereInput = {
      deletedAt: null,
      ...(status && { status }),
      ...(search && {
        OR: [
          { owner: { name: { contains: search, mode: 'insensitive' } } },
          {
            visitDetails: {
              some: {
                patient: { name: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      }),
      ...(date && dayRange(date)),
    };

    return paginate(
      this.prisma.visit,
      { where: whereCondition, include: listInclude },
      query,
    );
  }

  /** The dashboard's queue: everything happening on one calendar day. */
  async findForDay(date: string) {
    return await this.prisma.visit.findMany({
      where: { deletedAt: null, ...dayRange(date) },
      include: listInclude,
      orderBy: { visitDate: 'asc' },
    });
  }

  async findForBackup() {
    return await this.prisma.visit.findMany({ include: listInclude });
  }

  async create(input: CreateVisitDto) {
    const { userId, ownerId, visitType, status, visitDate, scheduleAt } = input;

    return await this.prisma.visit.create({
      data: { userId, ownerId, visitType, status, visitDate, scheduleAt },
    });
  }

  async createMany(inputs: CreateVisitDto[]) {
    return await this.prisma.visit.createMany({
      data: inputs.map(
        ({ userId, ownerId, visitType, status, visitDate, scheduleAt }) => ({
          userId,
          ownerId,
          visitType,
          status,
          visitDate,
          scheduleAt,
        }),
      ),
      skipDuplicates: true,
    });
  }

  /**
   * Save Only — the record keeps its work but the visit stays open, so a vet
   * can leave the screen and come back. Nothing is billed and no stock moves.
   */
  async saveAsDraft(id: string, input: SaveWorksheetDto) {
    await this.assertEditable(id);
    await this.writeWorksheet(id, input);

    await this.prisma.visit.update({
      where: { id },
      data: { status: 'ONGOING' },
    });

    return await this.findOne(id);
  }

  /**
   * Save and Make Invoice — writes the worksheet, closes the visit, prices
   * every service and product onto one invoice, and takes the products out of
   * stock. All of it in one transaction's worth of intent: if the invoice
   * cannot be priced, the visit is left open rather than closed unbilled.
   */
  async finish(id: string, input: SaveWorksheetDto) {
    const visit = await this.assertEditable(id);
    await this.writeWorksheet(id, input);

    const saved = await this.prisma.visit.findUniqueOrThrow({
      where: { id },
      include: worksheetInclude,
    });

    const lines = saved.visitDetails.flatMap((detail) => [
      ...detail.visitTreatmentAssocs.map((line) => ({
        treatmentId: line.treatmentId,
        productId: null,
        quantity: line.qty,
        unitPrice: Number(line.treatment.grossPrice),
        notes: detail.patient.name,
      })),
      ...detail.visitProductAssocs.map((line) => ({
        productId: line.productId,
        treatmentId: null,
        quantity: line.qty,
        unitPrice: Number(line.product.grossPrice),
        notes: detail.patient.name,
      })),
    ]);

    if (lines.length === 0) {
      throw new BadRequestException(
        'Nothing to invoice — add a service or a product before finishing this visit.',
      );
    }

    const { defaultPaymentMethod } = await this.settings.read();

    const invoice = await this.invoices.create({
      ownerId: visit.ownerId,
      visitId: id,
      paymentMethod: defaultPaymentMethod,
      status: 'PENDING',
      details: lines,
    });

    // Products consumed during the visit leave stock against the invoice, so
    // the ledger row points back at what caused the movement.
    await this.inventory.recordMany(
      saved.visitDetails.flatMap((detail) =>
        detail.visitProductAssocs.map((line) => ({
          productId: line.productId,
          movementType: 'MEDICAL_USE' as const,
          movementRef: invoice.identifier,
          changeQty: -line.qty,
          costUnitPrice: null,
          notes: `${detail.patient.name} · visit ${id}`,
        })),
      ),
    );

    await this.prisma.visit.update({
      where: { id },
      data: { status: 'FINISHED' },
    });

    return { visit: await this.findOne(id), invoice };
  }

  async cancel(id: string) {
    const visit = await this.prisma.visit.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: { invoices: { where: { deletedAt: null } } },
    });

    if (visit.status === 'FINISHED') {
      throw new BadRequestException(
        'This visit is finished. Cancel or void its invoice first.',
      );
    }

    return await this.prisma.visit.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  /**
   * A visit can be worked on until it is closed. The previous implementation
   * also required a `scheduleAt` in the future, which meant a walk-in
   * registered for right now could never be saved.
   */
  private async assertEditable(id: string) {
    const visit = await this.prisma.visit.findUniqueOrThrow({
      where: { id, deletedAt: null },
    });

    if (visit.status === 'FINISHED') {
      throw new BadRequestException(
        'This visit is finished and its record is locked.',
      );
    }
    if (visit.status === 'CANCELLED') {
      throw new BadRequestException('This visit was cancelled.');
    }

    return visit;
  }

  /**
   * Reconciles the worksheet against what is stored: details, their medical
   * record, the services performed and the products used. Rows that
   * disappeared are soft-deleted rather than hard-deleted, because a medical
   * record points at its visit detail and the history has to survive an edit.
   */
  private async writeWorksheet(visitId: string, input: SaveWorksheetDto) {
    await this.prisma.$transaction(async (tx) => {
      const existingDetails = await tx.visitDetail.findMany({
        where: { visitId, deletedAt: null },
      });

      const keptDetailIds = new Set(
        input.visitDetails
          .map((detail) => detail.id)
          .filter((id): id is string => Boolean(id)),
      );

      const removedDetailIds = existingDetails
        .filter((detail) => !keptDetailIds.has(detail.id))
        .map((detail) => detail.id);

      if (removedDetailIds.length > 0) {
        const now = new Date();
        await tx.visitDetail.updateMany({
          where: { id: { in: removedDetailIds } },
          data: { deletedAt: now },
        });
        await tx.medicalRecord.updateMany({
          where: { visitDetailId: { in: removedDetailIds } },
          data: { deletedAt: now },
        });
        await tx.visitTreatmentAssoc.updateMany({
          where: { visitDetailId: { in: removedDetailIds } },
          data: { deletedAt: now },
        });
        await tx.visitProductAssoc.updateMany({
          where: { visitDetailId: { in: removedDetailIds } },
          data: { deletedAt: now },
        });
      }

      for (const detail of input.visitDetails) {
        const row = detail.id
          ? await tx.visitDetail.update({
              where: { id: detail.id },
              data: { patientId: detail.patientId, vetId: detail.vetId },
            })
          : await tx.visitDetail.create({
              data: {
                visitId,
                patientId: detail.patientId,
                vetId: detail.vetId,
              },
            });

        const existingRecord = await tx.medicalRecord.findFirst({
          where: { visitDetailId: row.id, deletedAt: null },
        });

        if (existingRecord) {
          await tx.medicalRecord.update({
            where: { id: existingRecord.id },
            data: { ...detail.record, patientId: detail.patientId },
          });
        } else {
          await tx.medicalRecord.create({
            data: {
              ...detail.record,
              visitDetailId: row.id,
              patientId: detail.patientId,
            },
          });
        }

        // Services and products are replaced wholesale: they carry no history
        // of their own, and the worksheet always sends the complete set.
        const now = new Date();
        await tx.visitProductAssoc.updateMany({
          where: { visitDetailId: row.id, deletedAt: null },
          data: { deletedAt: now },
        });
        await tx.visitTreatmentAssoc.updateMany({
          where: { visitDetailId: row.id, deletedAt: null },
          data: { deletedAt: now },
        });

        // The client refers to a service by a local `ref` so a product can name
        // its parent before either row exists; map those refs to real ids here.
        const idByRef = new Map<string, string>();

        for (const service of detail.treatments) {
          const created = await tx.visitTreatmentAssoc.create({
            data: {
              visitDetailId: row.id,
              treatmentId: service.treatmentId,
              qty: service.qty,
            },
          });
          idByRef.set(service.ref, created.id);
        }

        for (const product of detail.products) {
          await tx.visitProductAssoc.create({
            data: {
              visitDetailId: row.id,
              visitTreatmentAssocId: product.treatmentRef
                ? (idByRef.get(product.treatmentRef) ?? null)
                : null,
              productId: product.productId,
              qty: product.qty,
            },
          });
        }
      }
    });
  }

  /** Kept for the generic controller surface every model shares. */
  async update(id: string, input: UpdateVisitDto) {
    const { visitDetails: _ignored, ...visitData } = input;
    return await this.prisma.visit.update({
      where: { id },
      data: visitData,
    });
  }

  async remove(id: string) {
    return await this.prisma.visit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeMany(ids: string[]) {
    return await this.prisma.visit.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return await this.prisma.visit.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async restoreMany(ids: string[]) {
    return await this.prisma.visit.updateMany({
      where: { id: { in: ids }, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.visit.delete({ where: { id } });
  }

  async forceRemoveMany(ids: string[]) {
    return await this.prisma.visit.deleteMany({ where: { id: { in: ids } } });
  }
}

/** Narrows a query to one calendar day in the server's timezone. */
function dayRange(date: string): Prisma.VisitWhereInput {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { visitDate: { gte: start, lt: end } };
}
