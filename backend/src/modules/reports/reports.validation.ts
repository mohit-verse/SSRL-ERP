import { z } from 'zod';

export const monthlyReportSchema = z.object({
  query: z.object({
    year: z
      .string()
      .regex(/^\d{4}$/)
      .transform(Number),
    month: z
      .string()
      .regex(/^(0?[1-9]|1[0-2])$/)
      .transform(Number),
  }),
});

export const ledgerReportSchema = z.object({
  query: z.object({
    id: z.string().min(1),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  }),
});

export const exportReportSchema = z.object({
  body: z.object({
    reportType: z.enum([
      'MONTHLY_TRIPS',
      'PARTY_LEDGER',
      'VEHICLE_OWNER_LEDGER',
      'OUTSTANDING_REPORT',
      'PENDING_POD',
      'FINANCIAL_SUMMARY',
      'PROFIT_SUMMARY',
    ]),
    format: z.enum(['EXCEL', 'PDF']),
    filters: z.any().optional(),
  }),
});
