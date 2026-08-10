import { z } from 'zod';

export const recordPaymentSchema = z.object({
  partyId: z.string().uuid('Please select a valid Party'),
  amount: z.number().positive('Amount must be positive'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  remarks: z.string().optional().nullable(),
});

export type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

export const cancelPaymentSchema = z.object({
  remarks: z.string().min(5, 'Reason for cancellation is required (min 5 characters)'),
});

export type CancelPaymentFormValues = z.infer<typeof cancelPaymentSchema>;
