import { z } from 'zod';
import { paginatedResponseSchema } from '../common/pagination.schema';
import { CreateVisitDetailSchema } from '../visit-detail/visit-detail.schema';

export const VisitTypeEnum = z.enum(['MEDIC', 'NON_MEDIC']);
export const VisitStatusEnum = z.enum([
  'SCHEDULED',
  'ONGOING',
  'FINISHED',
  'CANCELLED',
]);

// `visitDate`/`scheduleAt` stay string-typed at the schema boundary (transformed to Date)
// rather than z.coerce.date() — zod v4's JSON Schema conversion (used by nestjs-zod for
// Swagger) can't represent a bare date type and throws at boot if a DTO schema uses one.
export const CreateVisitSchema = z.object({
  userId: z.uuid('Invalid User ID format'),
  ownerId: z.uuid('Invalid Owner ID format'),
  visitType: VisitTypeEnum,
  visitDate: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => new Date(val)),
  status: VisitStatusEnum,
  scheduleAt: z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .transform((val) => new Date(val))
    .nullable()
    .optional(),
});

export const UpdateVisitSchema = CreateVisitSchema.partial().extend({
  visitDetails: z.array(CreateVisitDetailSchema),
});

export type CreateVisit = z.infer<typeof CreateVisitSchema>;
/**
 * What a client sends: `visitDate` and `scheduleAt` are ISO strings on the
 * wire and only become `Date` after the schema's transform runs on the server.
 */
export type CreateVisitInput = z.input<typeof CreateVisitSchema>;
export type UpdateVisit = z.infer<typeof UpdateVisitSchema>;

export const VisitResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  ownerId: z.uuid(),
  visitType: VisitTypeEnum,
  status: VisitStatusEnum,
  visitDate: z.coerce.date(),
  scheduleAt: z.coerce.date().nullable(),
  deletedAt: z.coerce.date().nullable(),
});

export type VisitResponse = z.infer<typeof VisitResponseSchema>;

export const VisitListResponseSchema =
  paginatedResponseSchema(VisitResponseSchema);
export type VisitListResponse = z.infer<typeof VisitListResponseSchema>;
