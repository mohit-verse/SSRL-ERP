import { z } from 'zod';

// Allows ISO datetime or YYYY-MM-DD
const dateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

export const createFinancialYearSchema = z.object({
  body: z.object({
    display_name: z.string().min(1).max(20),
    start_date: z.string().regex(dateRegex, 'Invalid date format'),
    end_date: z.string().regex(dateRegex, 'Invalid date format'),
  }),
});

export const updateFinancialYearSchema = z.object({
  body: z.object({
    display_name: z.string().min(1).max(20).optional(),
    start_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
    end_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
  }),
});
