'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { createRoom, joinRoom, parseError } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { BackButton } from './components/back-button';
import { CreateRoomSection } from './components/create-room-section';
import { InvitedSection } from './components/invited-section';
import { JoinRoomSection } from './components/join-room-section';
import { RedirectingCard } from './components/redirecting-card';
import { useCreateRoomForm } from './hooks/useCreateRoomForm';
import { useJoinRoomForm } from './hooks/useJoinRoomForm';
import type { CreateRoomForm, JoinRoomForm } from './types/form';

export function JoinForm() {
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

  const handleJoinRoom = async (data: JoinRoomForm) => {
    const { name, roomId } = data;
    const joinPromise = joinRoom(roomId, name);

    toast.promise(joinPromise, {
      loading: 'Joining room, please wait...',
      success: () => {
        router.push(`/room/${roomId}`);
        return 'Successfully joined room';
      },
      error: (error) => `Failed to join room.\n${parseError(error)}`,
    });

    return joinPromise;
  };

  const handleCreateRoom = (data: CreateRoomForm) => {
    const { name } = data;
    const createPromise = createRoom(name);

    toast.promise(createPromise, {
      loading: 'Creating room, please wait...',
      success: (roomId) => {
        router.push(`/room/${roomId}`);
        navigator.clipboard.writeText(roomId);
        return 'Successfully created room. Room ID has been copied to clipboard.';
      },
      error: (error) => `Failed to create room.\n${parseError(error)}`,
    });

    return createPromise;
  };

  const handleFormError = () => {
    toast.error('Please check the information and try again.');
  };

  if (createSuccessful || joinSuccessful) {
    return <RedirectingCard />;
  }

  return (
    <Card className="w-[480px] animate-fade-in">
      <CardHeader className="p-4 pt-6 md:p-6">
        <CardTitle>Kasca - Code Collaboration Platform</CardTitle>
        {!room && (
          <CardDescription>
            Create or join a room to start coding.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-6 md:px-6 md:pt-0">
        <div className="grid w-full items-center gap-6">
          {room ? (
            <>
              <div className="space-y-2 text-center">
                <p>You&apos;ve been invited to join a coding session!</p>
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
              <CreateRoomSection
                register={registerCreate}
                handleSubmit={handleSubmitCreate}
                onSubmit={handleCreateRoom}
                onError={handleFormError}
                errors={createErrors}
                isSubmitting={isCreating}
                isJoining={isJoining}
              />
              <Separator />
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
