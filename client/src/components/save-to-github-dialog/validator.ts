import { z } from 'zod';

export const commitSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  commitSummary: z.string().min(1, 'Commit summary is required'),
  extendedDescription: z
    .string()
    .min(1, 'Extended description is required')
    .optional()
    .or(z.literal('')),
});

export type CommitFormSchema = z.infer<typeof commitSchema>;
