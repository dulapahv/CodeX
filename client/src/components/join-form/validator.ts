import { z, ZodType } from "zod";

import { NAME_MAX_LENGTH } from "@/lib/constants";
import { CreateRoomForm, JoinRoomForm } from "@/types/types";

export const joinRoomSchema: ZodType<JoinRoomForm> = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`),
  roomId: z.string().min(1, "Room ID is required"),
});

export const createRoomSchema: ZodType<CreateRoomForm> = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`),
});
