import { z } from 'zod';

export const commitSchema = z.object({
  fileName: z
    .string()
    .min(1, 'File name is required')
    .max(4096, 'File name must be less than 4096 characters'),
  commitSummary: z
    .string()
    .min(1, 'Commit summary is required')
    .max(72, 'Commit summary must be less than 72 characters'),
});

export type CommitFormSchema = z.infer<typeof commitSchema>;
