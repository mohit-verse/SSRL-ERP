import { z } from 'zod';

export const updateVehicleDirectorySchema = z.object({
  body: z.object({
    owner_name: z.string().min(1).max(150),
    owner_mobile: z.string().min(1).max(20),
  }),
});
