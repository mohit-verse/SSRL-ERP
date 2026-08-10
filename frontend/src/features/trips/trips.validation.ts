import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const tripSchema = z.object({
  loading_date: z.string().regex(dateRegex, 'Invalid date format'),
  unloading_date: z.string().regex(dateRegex, 'Invalid date format').optional().or(z.literal('')),
  party_id: z.string().uuid('Select a valid party'),
  from_city: z.string().min(1, 'From City is required').max(120),
  to_city: z.string().min(1, 'To City is required').max(120),
  vehicle_number: z.string().min(1, 'Vehicle Number is required').max(30),
  driver_mobile: z.string().min(1, 'Driver Mobile is required').max(20),
  vehicle_owner_name: z.string().max(150).optional().or(z.literal('')),
  vehicle_owner_mobile: z.string().max(20).optional().or(z.literal('')),
  weight: z.coerce.number().optional().nullable(),
  freight_rate: z.coerce.number().min(0),
  vehicle_rate: z.coerce.number().min(0).optional().nullable(),
  lr_number: z.string().max(80).optional().or(z.literal('')),
  customer_advance: z.coerce.number().min(0).default(0),
  owner_advance: z.coerce.number().min(0).optional().nullable(),
  detention: z.coerce.number().min(0).optional().nullable(),
  deduction: z.coerce.number().min(0).optional().nullable(),
  remarks: z.string().optional().or(z.literal('')),
});

export type TripFormValues = z.infer<typeof tripSchema>;

export const tripExpenseSchema = z.object({
  expense_type: z.enum(['FUEL', 'DRIVER_BATTA', 'FASTAG', 'MAINTENANCE', 'OTHER']),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  expense_date: z.string().regex(dateRegex, 'Invalid date format'),
  remarks: z.string().optional().or(z.literal('')),
});

export type TripExpenseFormValues = z.infer<typeof tripExpenseSchema>;
