import { z } from 'zod';

export const generateBillSchema = z.object({
  partyId: z.string().uuid('Please select a valid Party'),
  billingType: z.enum(['INDIVIDUAL', 'CONSOLIDATED']),
  tripIds: z.array(z.string().uuid()).min(1, 'Please select at least one trip'),
  billDate: z.string().min(1, 'Bill date is required'),
  digitalSignature: z.boolean().default(false),
});

export type GenerateBillFormValues = z.infer<typeof generateBillSchema>;

export const cancelBillSchema = z.object({
  reason: z.string().min(5, 'Please provide a valid reason (min 5 characters)'),
});

export type CancelBillFormValues = z.infer<typeof cancelBillSchema>;
