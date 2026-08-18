import { z } from 'zod';

export const userFormSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(120),
  mobile: z.string().max(20).optional().nullable(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(80),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'USER', 'CA']),
});

export type UserFormValues = z.infer<typeof userFormSchema>;

export const resetPasswordFormSchema = z.object({
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
