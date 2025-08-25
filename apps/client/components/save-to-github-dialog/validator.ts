/**
 * Zod validation schemas for GitHub commit form.
 * Features:
 * - File name validation
 * - Commit message validation
 * - Type inference exports
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { z } from 'zod';

export const commitSchema = z.object({
  fileName: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'File name is required')
        .max(4096, 'File name must be less than 4096 characters'),
    ),
  commitSummary: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, 'Commit summary is required')
        .max(72, 'Commit summary must be less than 72 characters'),
    ),
});

export type CommitFormSchema = z.infer<typeof commitSchema>;
