import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).max(120),
    mobile: z.string().max(20).optional().nullable(),
    username: z.string().min(3).max(80),
    password: z.string().min(8),
    role: z.nativeEnum(UserRole),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    full_name: z.string().min(1).max(120).optional(),
    mobile: z.string().max(20).optional().nullable(),
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    new_password: z.string().min(8),
  }),
});
