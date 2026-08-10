import { z } from 'zod';

export const SettingsCategoryEnum = z.enum([
  'Company',
  'Numbering',
  'Documents',
  'Appearance',
  'System',
]);

export const updateSettingSchema = z.object({
  body: z.object({
    setting_value: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
  }),
});

export const createSettingSchema = z.object({
  body: z.object({
    setting_key: z.string().min(1).max(120),
    setting_value: z.string().nullable().optional(),
    category: SettingsCategoryEnum,
    description: z.string().nullable().optional(),
  }),
});
