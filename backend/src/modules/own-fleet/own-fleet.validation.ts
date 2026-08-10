import { z } from 'zod';
import { VehicleStatus } from '@prisma/client';

const dateRegex = /^\d{4}-\d{2}-\d{2}(T.*)?$/;

export const createOwnVehicleSchema = z.object({
  body: z.object({
    vehicle_number: z.string().min(1).max(30),
    vehicle_type: z.string().max(80).optional().nullable(),
    brand: z.string().max(80).optional().nullable(),
    model: z.string().max(80).optional().nullable(),
    manufacturing_year: z.number().int().optional().nullable(),
    chassis_number: z.string().max(100).optional().nullable(),
    engine_number: z.string().max(100).optional().nullable(),
    registration_date: z.string().regex(dateRegex, 'Invalid date format').optional().nullable(),
    purchase_date: z.string().regex(dateRegex, 'Invalid date format').optional().nullable(),
    status: z.nativeEnum(VehicleStatus),
  }),
});

export const updateOwnVehicleSchema = z.object({
  body: z.object({
    vehicle_number: z.string().min(1).max(30).optional(),
    vehicle_type: z.string().max(80).optional().nullable(),
    brand: z.string().max(80).optional().nullable(),
    model: z.string().max(80).optional().nullable(),
    manufacturing_year: z.number().int().optional().nullable(),
    chassis_number: z.string().max(100).optional().nullable(),
    engine_number: z.string().max(100).optional().nullable(),
    registration_date: z.string().regex(dateRegex, 'Invalid date format').optional().nullable(),
    purchase_date: z.string().regex(dateRegex, 'Invalid date format').optional().nullable(),
    status: z.nativeEnum(VehicleStatus).optional(),
  }),
});
