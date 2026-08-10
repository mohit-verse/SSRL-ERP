import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

export const financialYearFormSchema = z.object({
  display_name: z.string().min(1, 'Display name is required').max(20),
  start_date: z.string().regex(dateRegex, 'Invalid date format'),
  end_date: z.string().regex(dateRegex, 'Invalid date format'),
});

export type FinancialYearFormValues = z.infer<typeof financialYearFormSchema>;
