import { useRouter } from "next/navigation";

import { socket } from "@/lib/socket";
import { leaveRoom } from "@/lib/utils";

export function useRoomActions(roomId: string) {
  const router = useRouter();

  const handleLeaveRoom = () => {
    try {
      leaveRoom(roomId);
      socket.disconnect();
      router.push("/");
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  return {
    handleLeaveRoom,
  };
}
