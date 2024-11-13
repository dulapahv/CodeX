import { useRouter } from 'next/navigation';

import { leaveRoom } from '@/lib/utils';

export const useRoomActions = (roomId: string) => {
  const router = useRouter();

  const handleLeaveRoom = () => {
    try {
      leaveRoom(roomId);
      router.push('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  return {
    handleLeaveRoom,
  };
};
