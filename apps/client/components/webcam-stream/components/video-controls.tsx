/**
 * Video control overlay component for video chat interface.
 * Features:
 * - Microphone status indicator
 * - Speaker status indicator
 * - Local/remote state handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Mic, MicOff, Volume2, VolumeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

interface VideoControlsProps {
  isLocal: boolean;
  userId: string;
  micOn: boolean;
  speakersOn: boolean;
  remoteMicStates: Record<string, boolean>;
  remoteSpeakerStates: Record<string, boolean>;
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
    <div className="absolute right-2 top-2 flex gap-1">
      <div
        className={cn(
          'rounded px-1.5 py-0.5',
          micState ? 'bg-green-500/70' : 'bg-red-500/70',
        )}
      >
        {micState ? (
          <Mic className="size-4 text-white" />
        ) : (
          <MicOff className="size-4 text-white" />
        )}
      </div>
      <div
        className={cn(
          'rounded px-1.5 py-0.5',
          speakerState ? 'bg-green-500/70' : 'bg-red-500/70',
        )}
      >
        {speakerState ? (
          <Volume2 className="size-4 text-white" />
        ) : (
          <VolumeOff className="size-4 text-white" />
        )}
      </div>
    </div>
  );
};

export { VideoControls };
