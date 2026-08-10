import { z } from 'zod';

export const createSubmissionSchema = z.object({
  party_id: z.string().uuid('Please select a valid Party'),
  bill_ids: z.array(z.string().uuid()).min(1, 'Please select at least one bill'),
  submission_date: z.string().min(1, 'Submission date is required'),
  remarks: z.string().optional().nullable(),
});

export type CreateSubmissionFormValues = z.infer<typeof createSubmissionSchema>;

export const reissueSubmissionSchema = z.object({
  submission_date: z.string().min(1, 'Submission date is required'),
  remarks: z.string().optional().nullable(),
});

export type ReissueSubmissionFormValues = z.infer<typeof reissueSubmissionSchema>;
