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
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROOM_TERMINATED_KEY } from "@/lib/constants";
import { parseError } from "@/lib/utils";

import { BackButton } from "./components/back-button";
import { CreateRoomSection } from "./components/create-room-section";
import { InvitedSection } from "./components/invited-section";
import { JoinRoomSection } from "./components/join-room-section";
import { RedirectingCard } from "./components/redirecting-card";
import type { CreateRoomForm, JoinRoomForm } from "./types";
import { createRoom, isRoomIdValid, joinRoom } from "./utils";

interface RoomAccessFormProps {
  roomId: string;
}

const RoomAccessForm = ({ roomId }: RoomAccessFormProps) => {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isTerminated, setIsTerminated] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(ROOM_TERMINATED_KEY)) {
      sessionStorage.removeItem(ROOM_TERMINATED_KEY);
      setIsTerminated(true);
    }
  }, []);

  const handleJoinRoom = async (data: JoinRoomForm) => {
    setIsJoining(true);
    setJoinError(null);
    try {
      await joinRoom(data.roomId, data.name);
      router.push(`/room/${data.roomId}`);
      setIsSuccessful(true);
    } catch (error) {
      setJoinError(parseError(error));
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateRoom = async (data: CreateRoomForm) => {
    setIsCreating(true);
    setCreateError(null);
    try {
      const roomId = await createRoom(data.name);
      router.push(`/room/${roomId}`);
      navigator.clipboard.writeText(roomId).catch(() => undefined);
      setIsSuccessful(true);
    } catch (error) {
      setCreateError(`Failed to create room. ${parseError(error)}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (isSuccessful) {
    return (
      <div className="my-32 flex items-center justify-center">
        <RedirectingCard />
      </div>
    );
  }

  return (
    <Card
      aria-label="Room access form"
      className="border-none bg-black/20 backdrop-blur-xs"
      role="region"
    >
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        {/* biome-ignore lint/a11y/useSemanticElements: grouping form sections without fieldset semantics */}
        <div className="grid w-full items-center gap-4 sm:gap-6" role="group">
          {isTerminated && (
            <Alert variant="destructive">
              <AlertDescription>
                This room has been terminated by the host.
              </AlertDescription>
            </Alert>
          )}
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
                      Enter your name to join the room
                    </p>
                    <p className="text-base sm:text-lg">
                      Room:{" "}
                      <span className="font-bold font-mono">{roomId}</span>
                    </p>
                  </div>
                  <InvitedSection
                    error={joinError}
                    isCreating={isCreating}
                    isSubmitting={isJoining}
                    onSubmit={handleJoinRoom}
                    roomId={roomId}
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
                    error={createError}
                    isJoining={isJoining}
                    isSubmitting={isCreating}
                    onSubmit={handleCreateRoom}
                  />
                </section>
                <Separator />
                <section aria-label="Join existing room">
                  <JoinRoomSection
                    defaultRoomId=""
                    error={joinError}
                    isCreating={isCreating}
                    isSubmitting={isJoining}
                    onSubmit={handleJoinRoom}
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
