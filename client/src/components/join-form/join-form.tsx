"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { yupResolver } from "@hookform/resolvers/yup";
import { ArrowRight, CirclePlus } from "lucide-react";
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
    formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
  } = useForm<CreateRoomForm>({
    resolver: yupResolver(createRoomSchema),
    defaultValues: {
      name: "",
    },
  });

  const {
    register: registerJoin,
    handleSubmit: handleSubmitJoin,
    formState: { errors: errorsJoin, isSubmitting: isSubmittingJoin },
  } = useForm<JoinRoomForm>({
    resolver: yupResolver(joinRoomSchema),
    defaultValues: {
      name: "",
      roomId: room,
    },
  });

  async function onSubmitJoinRoom(data: JoinRoomForm) {
    const { name, roomId } = data;
    toast.promise(joinRoom(roomId, name), {
      loading: "Joining room, please wait...",
      success: () => {
        router.push(`/room/${roomId}`);
        return "Successfully joined room";
      },
      error: (error) => `Failed to join room.\n${parseError(error)}`,
    });
  }

  function onSubmitCreateRoom(data: CreateRoomForm) {
    const { name } = data;
    toast.promise(createRoom(name), {
      loading: "Creating room, please wait...",
      success: (roomId) => {
        router.push(`/room/${roomId}`);
        navigator.clipboard.writeText(roomId);
        return "Successfully created room. Room ID has been copied to clipboard.";
      },
      error: (error) => `Failed to create room.\n${parseError(error)}`,
    });
  }

  function onSubmitErrorHandler() {
    toast.error("Please check the information and try again.");
    return;
  }

  return (
    <Suspense>
      <Card className="w-[480px]">
        <CardHeader>
          <CardTitle>Online Code Collaboration Platform</CardTitle>
          <CardDescription>
            Create or join a room to start coding.
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
                      disabled={isSubmittingCreate}
                    >
                      <CirclePlus className="mr-2 h-4 w-4" />
                      {isSubmittingCreate ? "Creating..." : "Create Room"}
                    </Button>
                  </div>
                </form>

                <Separator />
              </>
            )}

            {/* Section for joining a collab room */}
            <form
              onSubmit={handleSubmitJoin(
                onSubmitJoinRoom,
                onSubmitErrorHandler,
              )}
            >
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-medium">Join a Room</h3>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="room-id">Room ID</Label>
                  <Input
                    id="room-id"
                    placeholder="Enter room ID"
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
                  disabled={isSubmittingJoin}
                >
                  {isSubmittingJoin ? "Joining..." : "Join Room"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </Suspense>
  );
}
