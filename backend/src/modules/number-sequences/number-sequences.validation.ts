import { z } from 'zod';
import { SequenceKey } from '@prisma/client';

export const previewNumberSchema = z.object({
  params: z.object({
    sequenceKey: z.nativeEnum(SequenceKey),
  }),
});

export const resetSequencesSchema = z.object({
  body: z.object({
    prefixes: z.record(z.nativeEnum(SequenceKey), z.string().min(1).max(10)).optional(),
  }),
});
