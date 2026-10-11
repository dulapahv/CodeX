/**
 * Custom hook for handling room-related actions.
 * Features:
 * - Room leaving handler
 * - Room termination for everyone
 * - Navigation after leaving
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRouter } from "next/navigation";

import { useRoom } from "@/lib/realtime/room-context";
import { storage } from "@/lib/services/storage";

export const useRoomActions = () => {
  const router = useRouter();
  const room = useRoom();

  // Leaving the room page closes the connection, which others see as a leave
  const handleLeaveRoom = () => {
    storage.clear();
    router.push("/");
  };

  const handleTerminateRoom = () => {
    room.send({ type: "terminate" });
    storage.clear();
    router.push("/");
  };

  return {
    handleLeaveRoom,
    handleTerminateRoom,
  };
};
