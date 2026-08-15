import { z } from 'zod';
import { BillingType } from '@prisma/client';

export const getEligibleTripsSchema = z.object({
  query: z.object({
    party_id: z.string().uuid(),
    billing_type: z.nativeEnum(BillingType),
  }),
});

export const generateBillSchema = z.object({
  body: z.object({
    tripIds: z.array(z.string().uuid()).min(1),
    partyId: z.string().uuid(),
    billingType: z.nativeEnum(BillingType),
    billDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid date format'),
    digitalSignature: z.boolean().default(false),
  }),
});

export const cancelBillSchema = z.object({
  body: z.object({
    reason: z.string().min(1),
  }),
});

export const downloadPdfSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    orientation: z.enum(['portrait', 'landscape']),
  }),
});
