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

"use client";

import { useRouter } from "next/navigation";

import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { parseError } from "@/lib/utils";

import { BackButton } from "./components/back-button";
import { CreateRoomSection } from "./components/create-room-section";
import { InvitedSection } from "./components/invited-section";
import { JoinRoomSection } from "./components/join-room-section";
import { RedirectingCard } from "./components/redirecting-card";
import { useCreateRoomForm } from "./hooks/useCreateRoomForm";
import { useJoinRoomForm } from "./hooks/useJoinRoomForm";
import type { CreateRoomForm, JoinRoomForm } from "./types";
import { createRoom, isRoomIdValid, joinRoom } from "./utils";

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
        loading: "Joining room, please wait...",
        success: () => {
          router.push(`/room/${roomId}`);
          return "Joined room successfully. Happy coding!";
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
        loading: "Creating room, please wait...",
        success: (roomId) => {
          router.push(`/room/${roomId}`);
          navigator.clipboard.writeText(roomId);
          return "Room created successfully. Happy coding!";
        },
        error: (error) => `Failed to create room.\n${parseError(error)}`,
      });

      return createPromise;
    } catch {
      // Toast already handles the error
    }
  };

  const handleFormError = () => {
    toast.error("Please check the information and try again.");
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
      aria-label="Room access form"
      className="border-none bg-black/20 backdrop-blur-sm"
      role="region"
    >
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        {/* biome-ignore lint/a11y/useSemanticElements: grouping form sections without fieldset semantics */}
        <div className="grid w-full items-center gap-4 sm:gap-6" role="group">
          {(() => {
            if (roomId && isRoomIdValid(roomId)) {
              return (
                <>
                  {/* biome-ignore lint/a11y/useSemanticElements: status div for invitation message */}
                  <div
                    aria-live="polite"
                    className="space-y-2 text-center"
                    role="status"
                  >
                    <p className="text-lg sm:text-xl">
                      You&apos;ve been invited to a coding session!
                    </p>
                    <p className="text-base sm:text-lg">
                      Room:{" "}
                      <span className="font-bold font-mono">{roomId}</span>
                    </p>
                    <p className="text-lg sm:text-xl">
                      Enter your name to join the room
                    </p>
                  </div>
                  <InvitedSection
                    errors={joinErrors}
                    handleSubmit={handleSubmitJoin}
                    isCreating={isCreating}
                    isSubmitting={isJoining}
                    onError={handleFormError}
                    onSubmit={handleJoinRoom}
                    register={registerJoin}
                  />
                  <BackButton
                    disabled={isJoining}
                    onClick={() => router.push("/")}
                  />
                </>
              );
            }
            if (roomId) {
              return (
                // biome-ignore lint/a11y/useSemanticElements: status div for invalid room message
                <div
                  aria-live="polite"
                  className="flex flex-col space-y-4 text-center"
                  role="status"
                >
                  <p className="font-medium text-lg sm:text-xl">
                    Invalid room ID
                  </p>
                  <p>
                    Please check the invite link and try again.
                    <br />
                    Room ID should look like this:{" "}
                    <span className="font-bold font-mono">XXXX-XXXX</span>
                  </p>
                  <BackButton
                    disabled={isJoining}
                    onClick={() => router.push("/")}
                  />
                </div>
              );
            }
            return (
              <>
                <section aria-label="Create new room">
                  <CreateRoomSection
                    errors={createErrors}
                    handleSubmit={handleSubmitCreate}
                    isJoining={isJoining}
                    isSubmitting={isCreating}
                    onError={handleFormError}
                    onSubmit={handleCreateRoom}
                    register={registerCreate}
                  />
                </section>
                <Separator />
                <section aria-label="Join existing room">
                  <JoinRoomSection
                    errors={joinErrors}
                    handleSubmit={handleSubmitJoin}
                    isCreating={isCreating}
                    isSubmitting={isJoining}
                    onError={handleFormError}
                    onSubmit={handleJoinRoom}
                    register={registerJoin}
                    setValue={setJoinValue}
                  />
                </section>
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
};

export { RoomAccessForm };
