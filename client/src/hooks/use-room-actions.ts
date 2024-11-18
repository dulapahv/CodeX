import { useRouter } from 'next/navigation';

import { leaveRoom } from '@/lib/utils';

export const useRoomActions = () => {
  const router = useRouter();

  const handleLeaveRoom = () => {
    try {
      leaveRoom();
      router.push('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  };

  return {
    handleLeaveRoom,
  };
};
