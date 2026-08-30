import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma.service';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { paginate } from '@/common/utils/pagination.util';
import { Prisma } from '@/database/prisma/generated/client';
import { SettingService } from '@/modules/settings/setting.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from './dto/invoice.dto';

/** Everything the invoice screen renders, in one round trip. */
const invoiceInclude = {
  owner: { select: { id: true, name: true, phone: true, email: true } },
  invoiceDetails: {
    where: { deletedAt: null },
    include: {
      product: { select: { id: true, name: true, dispensingUnit: true } },
      treatment: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.InvoiceInclude;

export type InvoiceLineInput = CreateInvoiceDto['details'][number];

@Injectable()
export class InvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingService,
  ) {}

  async findOne(id: string) {
    return await this.prisma.invoice.findUniqueOrThrow({
      where: { id, deletedAt: null },
      include: invoiceInclude,
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { search } = paginationDto;

    const whereCondition: Prisma.InvoiceWhereInput = search
      ? {
          deletedAt: null,
          OR: [
            { identifier: { contains: search, mode: 'insensitive' } },
            { owner: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : { deletedAt: null };

    return paginate(
      this.prisma.invoice,
      { where: whereCondition, include: invoiceInclude },
      paginationDto,
    );
  }

  async findForBackup() {
    return await this.prisma.invoice.findMany({ include: invoiceInclude });
  }

  async create(input: CreateInvoiceDto) {
    const priced = await this.priceLines(input.details);
    const identifier = await this.settings.nextInvoiceIdentifier();

    return await this.prisma.invoice.create({
      data: {
        identifier,
        ownerId: input.ownerId ?? null,
        visitId: input.visitId ?? null,
        paymentMethod: input.paymentMethod,
        status: input.status ?? 'PENDING',
        totalDiscount: input.totalDiscount ?? 0,
        totalBase: priced.totalBase,
        totalTax: priced.totalTax,
        totalGross: priced.totalGross - (input.totalDiscount ?? 0),
        invoiceDetails: { create: priced.details },
      },
      include: invoiceInclude,
    });
  }

  /**
   * Prices a set of lines against the catalog. The unit price comes from the
   * request — the visit worksheet locks it at the figure shown to the owner —
   * while tax is derived from the catalog row's base/gross spread, so a later
   * tax-rate change never rewrites an invoice that has already been issued.
   */
  async priceLines(details: InvoiceLineInput[]) {
    const productIds = details
      .map((line) => line.productId)
      .filter((id): id is string => Boolean(id));
    const treatmentIds = details
      .map((line) => line.treatmentId)
      .filter((id): id is string => Boolean(id));

    const [products, treatments] = await Promise.all([
      productIds.length
        ? this.prisma.product.findMany({ where: { id: { in: productIds } } })
        : Promise.resolve([]),
      treatmentIds.length
        ? this.prisma.treatment.findMany({
            where: { id: { in: treatmentIds } },
          })
        : Promise.resolve([]),
    ]);

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );
    const treatmentById = new Map(
      treatments.map((treatment) => [treatment.id, treatment]),
    );

    let totalBase = 0;
    let totalGross = 0;

    const rows = details.map((line) => {
      const catalog = line.productId
        ? productById.get(line.productId)
        : line.treatmentId
          ? treatmentById.get(line.treatmentId)
          : undefined;

      if (!catalog) {
        throw new NotFoundException(
          `Catalog item not found for invoice line ${
            line.productId ?? line.treatmentId
          }`,
        );
      }

      const basePrice = Number(catalog.basePrice);
      const subtotal = line.unitPrice * line.quantity;

      totalBase += basePrice * line.quantity;
      totalGross += subtotal;

      return {
        productId: line.productId ?? null,
        treatmentId: line.treatmentId ?? null,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal,
        notes: line.notes ?? null,
      };
    });

    return {
      details: rows,
      totalBase,
      totalGross,
      totalTax: totalGross - totalBase,
    };
  }

  async update(id: string, input: UpdateInvoiceDto) {
    // Marking an invoice paid stamps the time unless the caller supplied one.
    const paidAt =
      input.paidAt !== undefined
        ? input.paidAt
        : input.status === 'PAID'
          ? new Date()
          : undefined;

    return await this.prisma.invoice.update({
      where: { id },
      data: { ...input, ...(paidAt !== undefined && { paidAt }) },
      include: invoiceInclude,
    });
  }

  async remove(id: string) {
    return await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async removeMany(ids: string[]) {
    return await this.prisma.invoice.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: string) {
    return await this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async forceRemove(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      await tx.invoiceDetail.deleteMany({ where: { invoiceId: id } });
      return await tx.invoice.delete({ where: { id } });
    });
  }
}
