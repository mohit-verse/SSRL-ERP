import { z } from 'zod';

export const getEligibleBillsSchema = z.object({
  query: z.object({
    party_id: z.string().uuid(),
  }),
});

export const createSubmissionSchema = z.object({
  body: z.object({
    party_id: z.string().uuid(),
    bill_ids: z.array(z.string().uuid()).min(1),
    submission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid date format'),
    remarks: z.string().optional().nullable(),
  }),
});

export const reissueSubmissionSchema = z.object({
  body: z.object({
    submission_date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T.*)?$/, 'Invalid date format'),
    remarks: z.string().optional().nullable(),
  }),
});
