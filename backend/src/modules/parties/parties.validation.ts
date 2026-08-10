import { z } from 'zod';
import { PartyType, BillingType, PaymentType } from '@prisma/client';

const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const createPartySchema = z.object({
  body: z
    .object({
      party_name: z.string().min(1).max(200),
      party_type: z.nativeEnum(PartyType),
      gst_number: z.string().regex(gstRegex, 'Invalid GST Number').optional().nullable(),
      contact_person: z.string().max(120).optional().nullable(),
      mobile: z.string().max(20).optional().nullable(),
      email: z.string().email().max(120).optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().max(120).optional().nullable(),
      state: z.string().max(120).optional().nullable(),
      billing_type: z.nativeEnum(BillingType).optional().nullable(),
      payment_type: z.nativeEnum(PaymentType).optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.party_type === PartyType.COMPANY) {
        if (!data.billing_type) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Billing Type is required for Company parties',
            path: ['billing_type'],
          });
        }
        if (!data.payment_type) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Payment Type is required for Company parties',
            path: ['payment_type'],
          });
        }
      }
    }),
});

export const updatePartySchema = z.object({
  body: z
    .object({
      party_name: z.string().min(1).max(200).optional(),
      party_type: z.nativeEnum(PartyType).optional(),
      gst_number: z.string().regex(gstRegex, 'Invalid GST Number').optional().nullable(),
      contact_person: z.string().max(120).optional().nullable(),
      mobile: z.string().max(20).optional().nullable(),
      email: z.string().email().max(120).optional().nullable(),
      address: z.string().optional().nullable(),
      city: z.string().max(120).optional().nullable(),
      state: z.string().max(120).optional().nullable(),
      billing_type: z.nativeEnum(BillingType).optional().nullable(),
      payment_type: z.nativeEnum(PaymentType).optional().nullable(),
    })
    .superRefine((data, ctx) => {
      if (data.party_type === PartyType.COMPANY) {
        if (data.billing_type === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Billing Type is required for Company parties',
            path: ['billing_type'],
          });
        }
        if (data.payment_type === null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Payment Type is required for Company parties',
            path: ['payment_type'],
          });
        }
      }
    }),
});
