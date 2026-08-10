import { z } from 'zod';

export const resetSequencesSchema = z.object({
  financialYearId: z.string().uuid('Valid financial year ID required'),
});

export type ResetSequencesFormValues = z.infer<typeof resetSequencesSchema>;
