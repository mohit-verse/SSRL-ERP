import { z } from 'zod';
import { ExpenseType } from '@prisma/client';

const dateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

export const createTripSchema = z.object({
  body: z.object({
    loading_date: z.string().regex(dateRegex, 'Invalid date format'),
    party_id: z.string().uuid(),
    from_city: z.string().min(1).max(120),
    to_city: z.string().min(1).max(120),
    vehicle_number: z.string().min(1).max(30),
    driver_mobile: z.string().min(1).max(20),
    vehicle_owner_name: z.string().max(150).optional().nullable(),
    vehicle_owner_mobile: z.string().max(20).optional().nullable(),
    weight: z.number().optional().nullable(),
    freight_rate: z.number().min(0),
    vehicle_rate: z.number().min(0).optional().nullable(),
    lr_number: z.string().max(80).optional().nullable(),
    customer_advance: z.number().min(0).default(0),
    owner_advance: z.number().min(0).optional().nullable(),
    remarks: z.string().optional().nullable(),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    loading_date: z.string().regex(dateRegex, 'Invalid date format').optional(),
    unloading_date: z.string().regex(dateRegex, 'Invalid date format').optional().nullable(),
    from_city: z.string().min(1).max(120).optional(),
    to_city: z.string().min(1).max(120).optional(),
    vehicle_number: z.string().min(1).max(30).optional(),
    driver_mobile: z.string().min(1).max(20).optional(),
    vehicle_owner_name: z.string().max(150).optional().nullable(),
    vehicle_owner_mobile: z.string().max(20).optional().nullable(),
    weight: z.number().optional().nullable(),
    freight_rate: z.number().min(0).optional(),
    vehicle_rate: z.number().min(0).optional().nullable(),
    lr_number: z.string().max(80).optional().nullable(),
    customer_advance: z.number().min(0).optional(),
    owner_advance: z.number().min(0).optional().nullable(),
    detention: z.number().min(0).optional().nullable(),
    deduction: z.number().min(0).optional().nullable(),
    remarks: z.string().optional().nullable(),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    expense_type: z.nativeEnum(ExpenseType),
    amount: z.number().min(0),
    expense_date: z.string().regex(dateRegex, 'Invalid date format'),
    remarks: z.string().optional().nullable(),
  }),
});
