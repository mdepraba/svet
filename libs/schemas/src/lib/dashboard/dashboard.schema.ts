import { z } from 'zod';

/**
 * The dashboard's four figures. Computed server-side because each one is an
 * aggregate over a table the client would otherwise have to page through —
 * "revenue today" summed from one page of invoices would be wrong on a busy
 * day, and silently so.
 */
export const DashboardSummarySchema = z.object({
  visitsToday: z.object({
    total: z.number().int(),
    scheduled: z.number().int(),
    ongoing: z.number().int(),
    finished: z.number().int(),
  }),
  revenueToday: z.object({
    total: z.coerce.number(),
    paidCount: z.number().int(),
    pendingCount: z.number().int(),
  }),
  lowStock: z.object({
    count: z.number().int(),
    threshold: z.number().int(),
  }),
  patientsSeen: z.object({
    thisWeek: z.number().int(),
    lastWeek: z.number().int(),
  }),
});

export type DashboardSummary = z.infer<typeof DashboardSummarySchema>;
