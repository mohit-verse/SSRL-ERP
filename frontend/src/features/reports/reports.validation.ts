import { z } from 'zod';

export const monthlyReportFormSchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Valid 4-digit year required'),
  month: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'Valid month (1-12) required'),
});

export type MonthlyReportFormValues = z.infer<typeof monthlyReportFormSchema>;

export const ledgerReportFormSchema = z.object({
  id: z.string().min(1, 'Target ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required').optional().or(z.literal('')),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid YYYY-MM-DD required').optional().or(z.literal('')),
});

export type LedgerReportFormValues = z.infer<typeof ledgerReportFormSchema>;
