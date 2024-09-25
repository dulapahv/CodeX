import * as yup from "yup";

import { NAME_MAX_LENGTH } from "@/lib/constants";

export const joinRoomSchema = yup.object().shape({
  name: yup
    .string()
    .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`)
    .required("Name is required"),
  roomId: yup.string().required("Room ID is required"),
});

export const createRoomSchema = yup.object().shape({
  name: yup
    .string()
    .max(NAME_MAX_LENGTH, `Name must not exceed ${NAME_MAX_LENGTH} characters`)
    .required("Name is required"),
});
