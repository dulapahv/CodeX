"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowLeft, ArrowRight, CirclePlus, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { createRoom, joinRoom, parseError } from "@/lib/utils";
import { CreateRoomForm, JoinRoomForm } from "@/types/types";

import { createRoomSchema, joinRoomSchema } from "./validator";

export function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const room = searchParams.get("room") || "";

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: {
      errors: errorsCreate,
      isSubmitting: isSubmittingCreate,
      isSubmitSuccessful: isSubmitSuccessfulCreate,
    },
  } = useForm<CreateRoomForm>({
    resolver: yupResolver(createRoomSchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: {
      errors: errorsJoin,
      isSubmitting: isSubmittingJoin,
      isSubmitSuccessful: isSubmitSuccessfulJoin,
    },
  } = useForm<JoinRoomForm>({
    resolver: yupResolver(joinRoomSchema),
    defaultValues: {
      name: "",
      roomId: room,
    },
  });

  async function onSubmitJoinRoom(data: JoinRoomForm) {
    const { name, roomId } = data;

    const joinPromise = joinRoom(roomId, name);

    toast.promise(joinPromise, {
      loading: "Joining room, please wait...",
      success: () => {
        router.push(`/room/${roomId}`);
        return "Successfully joined room";
      },
      error: (error) => `Failed to join room.\n${parseError(error)}`,
    });

    return joinPromise; // Return the promise to handle the isSubmitting state
  }

  function onSubmitCreateRoom(data: CreateRoomForm) {
    const { name } = data;

    const createPromise = createRoom(name);

    toast.promise(createPromise, {
      loading: "Creating room, please wait...",
      success: (roomId) => {
        router.push(`/room/${roomId}`);
        navigator.clipboard.writeText(roomId);
        return "Successfully created room. Room ID has been copied to clipboard.";
      },
      error: (error) => `Failed to create room.\n${parseError(error)}`,
    });

    return createPromise; // Return the promise to handle the isSubmitting state
  }

  function onSubmitErrorHandler() {
    toast.error("Please check the information and try again.");
    return;
  }

  if (isSubmitSuccessfulCreate || isSubmitSuccessfulJoin) {
    return (
      <Card className="w-[480px] animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-base font-normal">
            <LoaderCircle className="mr-2 size-5 animate-spin" />
            You will be redirected to the room shortly.
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-[480px] animate-fade-in">
      <CardHeader>
        <CardTitle>Kasca - Code Collaboration Platform</CardTitle>
        <CardDescription>
          {room
            ? "You have been invited to a room. Enter your name to join."
            : "Create or join a room to start coding."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-6">
          {!room && (
            <>
              {/* Section for creating a collab room */}
              <form
                onSubmit={handleSubmitCreate(
                  onSubmitCreateRoom,
                  onSubmitErrorHandler,
                )}
              >
                <div className="flex flex-col space-y-4">
                  <h3 className="text-lg font-medium">Create a Room</h3>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="name-create">Name</Label>
                    <Input
                      id="name-create"
                      placeholder="Enter your name"
                      disabled={isSubmittingCreate || isSubmittingJoin}
                      {...registerCreate("name")}
                    />
                    {errorsCreate.name && (
                      <p className="text-sm text-red-500">
                        {errorsCreate.name.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="bg-primary"
                    disabled={isSubmittingCreate || isSubmittingJoin}
                  >
                    {isSubmittingCreate ? (
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                    ) : (
                      <CirclePlus className="mr-2 size-4" />
                    )}
                    {isSubmittingCreate ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </form>

              <Separator />
            </>
          )}

          {room && (
            <Button
              variant="link"
              className="size-fit p-0 text-foreground"
              size="sm"
              onClick={() => router.push("/")}
              disabled={isSubmittingJoin}
            >
              <ArrowLeft className="mr-2 size-4" />
              Back to create/join room
            </Button>
          )}

          {/* Section for joining a collab room */}
          <form
            onSubmit={handleSubmitJoin(onSubmitJoinRoom, onSubmitErrorHandler)}
          >
            <div className="flex flex-col space-y-4">
              <h3 className="text-lg font-medium">Join a Room</h3>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="room-id">Room ID</Label>
                <Input
                  id="room-id"
                  placeholder="Enter room ID"
                  disabled={!!room || isSubmittingCreate || isSubmittingJoin}
                  {...registerJoin("roomId")}
                />
                {errorsJoin.roomId && (
                  <p className="text-sm text-red-500">
                    {errorsJoin.roomId.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="name-join">Name</Label>
                <Input
                  id="name-join"
                  placeholder="Enter your name"
                  disabled={isSubmittingCreate || isSubmittingJoin}
                  {...registerJoin("name")}
                />
                {errorsJoin.name && (
                  <p className="text-sm text-red-500">
                    {errorsJoin.name.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="bg-primary"
                disabled={isSubmittingJoin || isSubmittingCreate}
              >
                {isSubmittingJoin && (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                )}
                {isSubmittingJoin ? "Joining..." : "Join Room"}
                {!isSubmittingJoin && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
