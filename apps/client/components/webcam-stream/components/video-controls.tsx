/**
 * Video control overlay component for video chat interface.
 * Features:
 * - Microphone status indicator
 * - Speaker status indicator
 * - Local/remote state handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  SpeakerHighIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

interface VideoControlsProps {
  isLocal: boolean;
  micOn: boolean;
  remoteMicStates: Record<string, boolean>;
  remoteSpeakerStates: Record<string, boolean>;
  speakersOn: boolean;
  userId: string;
}

const VideoControls = ({
  isLocal,
  userId,
  micOn,
  speakersOn,
  remoteMicStates,
  remoteSpeakerStates,
}: VideoControlsProps) => {
  const micState = isLocal ? micOn : remoteMicStates[userId];
  const speakerState = isLocal ? speakersOn : remoteSpeakerStates[userId];

  return (
    <div className="absolute top-2 right-2 flex gap-1">
      <div
        className={cn(
          "px-1.5 py-0.5",
          micState ? "bg-green-500/70" : "bg-red-500/70"
        )}
      >
        {micState ? (
          <MicrophoneIcon className="size-4 text-white" />
        ) : (
          <MicrophoneSlashIcon className="size-4 text-white" />
        )}
      </div>
      <div
        className={cn(
          "px-1.5 py-0.5",
          speakerState ? "bg-green-500/70" : "bg-red-500/70"
        )}
      >
        {speakerState ? (
          <SpeakerHighIcon className="size-4 text-white" />
        ) : (
          <SpeakerSlashIcon className="size-4 text-white" />
        )}
      </div>
    </div>
  );
};

export { VideoControls };
