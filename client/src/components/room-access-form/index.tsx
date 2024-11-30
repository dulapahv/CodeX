/**
 * Join Form component that handles room creation and joining functionality.
 * Provides a form interface for creating new rooms or joining existing ones.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
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
import { createRoom, joinRoom } from './utils';

const RoomAccessForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams.get('room') || '';

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
  } = useJoinRoomForm(room);

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
    return <RedirectingCard />;
  }

  return (
    <Card
      className="w-[480px] bg-background/50 backdrop-blur delay-75"
      role="region"
      aria-label="Room access form"
    >
      <CardContent className="px-4 pb-6 pt-6 md:px-6">
        <div className="grid w-full items-center gap-6" role="group">
          {room ? (
            <>
              <div
                className="space-y-2 text-center"
                role="status"
                aria-live="polite"
              >
                <p>You&apos;ve been invited to a coding session!</p>
                <p className="text-lg">
                  Room: <span className="font-bold">{room}</span>
                </p>
                <p className="text-sm">Enter your name to join the room</p>
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
              <Separator role="separator" />
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
