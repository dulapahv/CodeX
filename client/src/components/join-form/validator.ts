/**
 * Form validation schemas for room creation and joining using Zod.
 *
 * @example
 * ```ts
 * // Validate join room form
 * const result = joinRoomSchema.safeParse({
 *   name: "John",
 *   roomId: "ABCD-1234"
 * });
 *
 * // Validate create room form
 * const result = createRoomSchema.safeParse({
 *   name: "John"
 * });
 * ```
 *
 * @remarks
 * Uses [`NAME_MAX_LENGTH`](src/lib/constants.ts) for name validation.
 * Room ID must match pattern: 4 alphanumeric chars + hyphen + 4
 * alphanumeric chars.
 *
 * Exports:
 * - `joinRoomSchema` - Schema for room joining form
 * - `createRoomSchema` - Schema for room creation form
 * - Type definitions for form data
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { z } from 'zod';

import { NAME_MAX_LENGTH } from '@/lib/constants';

const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`);

export const joinRoomSchema = z.object({
  name: nameSchema,
  roomId: z.string().regex(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid room ID'),
});

export const createRoomSchema = z.object({
  name: nameSchema,
});

export type JoinRoomFormSchema = z.infer<typeof joinRoomSchema>;
export type CreateRoomFormSchema = z.infer<typeof createRoomSchema>;
