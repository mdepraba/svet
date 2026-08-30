import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';
import { VisitStatusEnum, VisitTypeEnum } from './visit.schema';

/**
 * Read models for the visit screens. `VisitResponseSchema` is the bare row;
 * these two carry the relations the list and the worksheet actually render,
 * so neither screen has to fan out into six more requests to draw one page.
 *
 * Prisma serialises Decimal as a string over JSON, hence `z.coerce.number()`
 * on every money field.
 */

const NamedRef = z.object({ id: z.uuid(), name: z.string() });

const VisitInvoiceRef = z.object({
  id: z.uuid(),
  identifier: z.string(),
  status: z.enum(['PENDING', 'PAID', 'CANCELLED']),
  totalGross: z.coerce.number(),
});

/* ── list ───────────────────────────────────────────────────────────────── */

/** The visit log's own filters, on top of the shared pagination params. */
export const VisitQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional().default('visitDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  status: VisitStatusEnum.optional(),
  /** `YYYY-MM-DD`; narrows to visits on that calendar day. */
  date: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
});

export type VisitQuery = z.infer<typeof VisitQuerySchema>;

export const VisitListItemSchema = z.object({
  id: z.uuid(),
  visitType: VisitTypeEnum,
  status: VisitStatusEnum,
  visitDate: z.coerce.date(),
  scheduleAt: z.coerce.date().nullable(),
  owner: NamedRef,
  visitDetails: z.array(
    z.object({
      id: z.uuid(),
      patient: NamedRef,
      vet: NamedRef,
    }),
  ),
  invoices: z.array(VisitInvoiceRef),
});

export type VisitListItem = z.infer<typeof VisitListItemSchema>;

export const VisitListItemsResponseSchema =
  paginatedResponseSchema(VisitListItemSchema);
export type VisitListItemsResponse = z.infer<
  typeof VisitListItemsResponseSchema
>;

/* ── worksheet ──────────────────────────────────────────────────────────── */

const WorksheetPatient = z.object({
  id: z.uuid(),
  name: z.string(),
  species: z.string(),
  breed: z.string().nullable(),
  dob: z.coerce.date().nullable(),
});

const WorksheetRecord = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  patientId: z.uuid(),
  anamnesis: z.string().nullable(),
  temperature: z.number().nullable(),
  pulse: z.number().int().nullable(),
  respiration: z.number().int().nullable(),
  weight: z.number().nullable(),
  notes: z.string().nullable(),
  diagnosis: z.string().nullable(),
  treatment: z.string().nullable(),
});

const WorksheetTreatmentLine = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  treatmentId: z.uuid(),
  qty: z.number().int(),
  treatment: z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string().nullable(),
    grossPrice: z.coerce.number(),
  }),
});

const WorksheetProductLine = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  visitTreatmentAssocId: z.uuid().nullable(),
  productId: z.uuid(),
  qty: z.number().int(),
  product: z.object({
    id: z.uuid(),
    name: z.string(),
    dispensingUnit: z.string(),
    grossPrice: z.coerce.number(),
    /** Current on-hand quantity, for the "stock after" column. */
    stock: z.coerce.number().nullable(),
  }),
});

export const VisitWorksheetDetailSchema = z.object({
  id: z.uuid(),
  visitId: z.uuid(),
  patientId: z.uuid(),
  vetId: z.uuid(),
  patient: WorksheetPatient,
  vet: NamedRef,
  medicalRecords: z.array(WorksheetRecord),
  visitTreatmentAssocs: z.array(WorksheetTreatmentLine),
  visitProductAssocs: z.array(WorksheetProductLine),
});

export type VisitWorksheetDetail = z.infer<typeof VisitWorksheetDetailSchema>;

export const VisitWorksheetSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  ownerId: z.uuid(),
  visitType: VisitTypeEnum,
  status: VisitStatusEnum,
  visitDate: z.coerce.date(),
  scheduleAt: z.coerce.date().nullable(),
  owner: z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
  }),
  visitDetails: z.array(VisitWorksheetDetailSchema),
  invoices: z.array(VisitInvoiceRef),
});

export type VisitWorksheet = z.infer<typeof VisitWorksheetSchema>;

/* ── a patient's history, for the worksheet's right rail ────────────────── */

export const PatientRecordHistoryItemSchema = z.object({
  id: z.uuid(),
  visitDetailId: z.uuid(),
  recordedAt: z.coerce.date(),
  vetName: z.string().nullable(),
  diagnosis: z.string().nullable(),
  anamnesis: z.string().nullable(),
  temperature: z.number().nullable(),
  pulse: z.number().int().nullable(),
  weight: z.number().nullable(),
});

export type PatientRecordHistoryItem = z.infer<
  typeof PatientRecordHistoryItemSchema
>;

export const PatientRecordHistorySchema = z.array(
  PatientRecordHistoryItemSchema,
);

/* ── the write payload the worksheet saves ──────────────────────────────── */

export const SaveWorksheetDetailSchema = z.object({
  /** Present when editing an existing detail; absent when adding a patient. */
  id: z.uuid().optional(),
  patientId: z.uuid(),
  vetId: z.uuid(),
  record: z.object({
    anamnesis: z.string().nullable().optional(),
    temperature: z.number().nullable().optional(),
    pulse: z.number().int().nullable().optional(),
    respiration: z.number().int().nullable().optional(),
    weight: z.number().nullable().optional(),
    notes: z.string().nullable().optional(),
    diagnosis: z.string().nullable().optional(),
    treatment: z.string().nullable().optional(),
  }),
  treatments: z.array(
    z.object({
      /** Client-side key, so products can point at their parent service
          before either row has a database id. */
      ref: z.string(),
      treatmentId: z.uuid(),
      qty: z.number().int().min(1),
    }),
  ),
  products: z.array(
    z.object({
      productId: z.uuid(),
      qty: z.number().int().min(1),
      /** `ref` of the service this product came from, or null if added by hand. */
      treatmentRef: z.string().nullable(),
    }),
  ),
});

export const SaveWorksheetSchema = z.object({
  visitDetails: z.array(SaveWorksheetDetailSchema),
});

export type SaveWorksheet = z.infer<typeof SaveWorksheetSchema>;
export type SaveWorksheetDetail = z.infer<typeof SaveWorksheetDetailSchema>;
