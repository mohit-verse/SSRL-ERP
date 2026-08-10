import { z } from 'zod';

export const settingFormSchema = z.object({
  setting_key: z.string().min(1, 'Key is required').max(120),
  setting_value: z.string().nullable().optional(),
  category: z.enum(['Company', 'Numbering', 'Documents', 'Appearance', 'System']),
  description: z.string().nullable().optional(),
});

export type SettingFormValues = z.infer<typeof settingFormSchema>;

export const settingUpdateFormSchema = z.object({
  setting_value: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export type SettingUpdateFormValues = z.infer<typeof settingUpdateFormSchema>;
