import type {
  FieldErrors,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";
import { CirclePlus, LoaderCircle } from "lucide-react";

import type { CreateRoomForm } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateRoomSectionProps {
  register: UseFormRegister<CreateRoomForm>;
  handleSubmit: UseFormHandleSubmit<CreateRoomForm>;
  onSubmit: (data: CreateRoomForm) => Promise<void> | Promise<any>;
  onError: () => void;
  errors: FieldErrors<CreateRoomForm>;
  isSubmitting: boolean;
  isJoining: boolean;
}

export const CreateRoomSection = ({
  register,
  handleSubmit,
  onSubmit,
  onError,
  errors,
  isSubmitting,
  isJoining,
}: CreateRoomSectionProps) => (
  <form onSubmit={handleSubmit((data) => onSubmit(data), onError)}>
    <div className="flex flex-col space-y-4">
      <h3 className="text-lg font-medium">Create a Room</h3>
      <div className="flex flex-col space-y-1.5">
        <Label htmlFor="name-create">Name</Label>
        <Input
          id="name-create"
          placeholder="Enter your name"
          disabled={isSubmitting || isJoining}
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="bg-primary"
        disabled={isSubmitting || isJoining}
      >
        {isSubmitting ? (
          <LoaderCircle className="mr-2 size-4 animate-spin" />
        ) : (
          <CirclePlus className="mr-2 size-4" />
        )}
        {isSubmitting ? "Creating..." : "Create Room"}
      </Button>
    </div>
  </form>
);
