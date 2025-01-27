/**
 * Zod validation schemas for room access forms.
 * Features:
 * - Name validation rules
 * - Room ID format validation
 * - Type inference exports
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { z } from 'zod';

import { NAME_MAX_LENGTH } from '@/lib/constants';

const nameSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, { message: 'Name is required' })
      .max(
        NAME_MAX_LENGTH,
        `Name must not exceed ${NAME_MAX_LENGTH} characters`,
      ),
  );

export const joinRoomSchema = z.object({
  name: nameSchema,
  roomId: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid room ID'),
});

export const createRoomSchema = z.object({
  name: nameSchema,
});

export type JoinRoomFormSchema = z.infer<typeof joinRoomSchema>;
export type CreateRoomFormSchema = z.infer<typeof createRoomSchema>;
