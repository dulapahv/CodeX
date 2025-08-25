/**
 * Room access form that handles room creation and joining.
 * Features:
 * - Room creation form
 * - Room joining form
 * - Form validation
 * - Redirection handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useRouter } from 'next/navigation';

import { toast } from 'sonner';

import { parseError } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { BackButton } from './components/back-button';
import { CreateRoomSection } from './components/create-room-section';
import { InvitedSection } from './components/invited-section';
import { JoinRoomSection } from './components/join-room-section';
import { RedirectingCard } from './components/redirecting-card';
import { useCreateRoomForm } from './hooks/useCreateRoomForm';
import { useJoinRoomForm } from './hooks/useJoinRoomForm';
import type { CreateRoomForm, JoinRoomForm } from './types';
import { createRoom, isRoomIdValid, joinRoom } from './utils';

interface RoomAccessFormProps {
  roomId: string;
}

const RoomAccessForm = ({ roomId }: RoomAccessFormProps) => {
  const router = useRouter();

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: {
      errors: createErrors,
      isSubmitting: isCreating,
      isSubmitSuccessful: createSuccessful,
    },
  } = useCreateRoomForm();

  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    setValue: setJoinValue,
    formState: {
      errors: joinErrors,
      isSubmitting: isJoining,
      isSubmitSuccessful: joinSuccessful,
    },
  } = useJoinRoomForm(roomId);

  const handleJoinRoom = (data: JoinRoomForm) => {
    const { name, roomId } = data;
    try {
      const joinPromise = joinRoom(roomId, name);

      toast.promise(joinPromise, {
        loading: 'Joining room, please wait...',
        success: () => {
          router.push(`/room/${roomId}`);
          return 'Joined room successfully. Happy coding!';
        },
        error: (error) => `Failed to join room.\n${parseError(error)}`,
      });

      return joinPromise;
    } catch {
      // Toast already handles the error
    }
  };

  const handleCreateRoom = (data: CreateRoomForm) => {
    try {
      const { name } = data;
      const createPromise = createRoom(name);

      toast.promise(createPromise, {
        loading: 'Creating room, please wait...',
        success: (roomId) => {
          router.push(`/room/${roomId}`);
          navigator.clipboard.writeText(roomId);
          return 'Room created successfully. Happy coding!';
        },
        error: (error) => `Failed to create room.\n${parseError(error)}`,
      });

      return createPromise;
    } catch {
      // Toast already handles the error
    }
  };

  const handleFormError = () => {
    toast.error('Please check the information and try again.');
  };

  if (createSuccessful || joinSuccessful) {
    return (
      <div className="my-32 flex items-center justify-center">
        <RedirectingCard />
      </div>
    );
  }

  return (
    <Card
      className="border-none bg-black/20 backdrop-blur-sm"
      role="region"
      aria-label="Room access form"
    >
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid w-full items-center gap-4 sm:gap-6" role="group">
          {roomId ? (
            isRoomIdValid(roomId) ? (
              <>
                <div
                  className="space-y-2 text-center"
                  role="status"
                  aria-live="polite"
                >
                  <p className="text-lg sm:text-xl">
                    You&apos;ve been invited to a coding session!
                  </p>
                  <p className="text-base sm:text-lg">
                    Room: <span className="font-mono font-bold">{roomId}</span>
                  </p>
                  <p className="text-lg sm:text-xl">
                    Enter your name to join the room
                  </p>
                </div>
                <InvitedSection
                  register={registerJoin}
                  handleSubmit={handleSubmitJoin}
                  onSubmit={handleJoinRoom}
                  onError={handleFormError}
                  errors={joinErrors}
                  isSubmitting={isJoining}
                  isCreating={isCreating}
                />
                <BackButton
                  onClick={() => router.push('/')}
                  disabled={isJoining}
                />
              </>
            ) : (
              <div
                className="flex flex-col space-y-4 text-center"
                role="status"
                aria-live="polite"
              >
                <p className="text-lg font-medium sm:text-xl">
                  Invalid room ID
                </p>
                <p>
                  Please check the invite link and try again.
                  <br />
                  Room ID should look like this:{' '}
                  <span className="font-mono font-bold">XXXX-XXXX</span>
                </p>
                <BackButton
                  onClick={() => router.push('/')}
                  disabled={isJoining}
                />
              </div>
            )
          ) : (
            <>
              <section aria-label="Create new room">
                <CreateRoomSection
                  register={registerCreate}
                  handleSubmit={handleSubmitCreate}
                  onSubmit={handleCreateRoom}
                  onError={handleFormError}
                  errors={createErrors}
                  isSubmitting={isCreating}
                  isJoining={isJoining}
                />
              </section>
              <Separator />
              <section aria-label="Join existing room">
                <JoinRoomSection
                  register={registerJoin}
                  setValue={setJoinValue}
                  handleSubmit={handleSubmitJoin}
                  onSubmit={handleJoinRoom}
                  onError={handleFormError}
                  errors={joinErrors}
                  isSubmitting={isJoining}
                  isCreating={isCreating}
                />
              </section>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export { RoomAccessForm };
