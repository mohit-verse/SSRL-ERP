import { z } from 'zod';

export const recordPaymentSchema = z.object({
  body: z.object({
    partyId: z.string().uuid(),
    amount: z.number().positive(),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid date format'),
    referenceNumber: z.string().min(1),
    remarks: z.string().optional().nullable(),
  }),
});

export const cancelPaymentSchema = z.object({
  body: z.object({
    remarks: z.string().min(1),
  }),
});
