/**
 * Video grid component that displays local and remote video streams.
 * Renders video elements with user avatars and control overlays.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";
import { type RefObject, useEffect, useRef } from "react";
import { Avatar } from "@/components/avatar";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { storage } from "@/lib/services/storage";
import { parseError } from "@/lib/utils";

import { reportWebcamError } from "../utils/errors";
import { VideoControls } from "./video-controls";

interface RemoteVideoProps {
  audioOutput: string;
  muted: boolean;
  stream: MediaStream;
}

const RemoteVideo = ({ audioOutput, muted, stream }: RemoteVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const video = videoRef.current;
    if (audioOutput && video && "setSinkId" in video) {
      video.setSinkId(audioOutput).catch((error: unknown) => {
        reportWebcamError(`Error setting audio output: ${parseError(error)}`);
      });
    }
  }, [audioOutput]);

  return (
    <video
      autoPlay
      className="size-full scale-x-[-1] object-cover"
      muted={muted}
      playsInline
      ref={videoRef}
    />
  );
};

interface VideoGridProps {
  audioOutput: string;
  cameraOn: boolean;
  micOn: boolean;
  remoteMicStates: Record<string, boolean>;
  remoteSpeakerStates: Record<string, boolean>;
  remoteStreams: Record<string, MediaStream | null>;
  speakerOn: boolean;
  users: User[];
  videoRef: RefObject<HTMLVideoElement | null>;
}

export const VideoGrid = ({
  audioOutput,
  users,
  cameraOn,
  micOn,
  speakerOn,
  videoRef,
  remoteStreams,
  remoteMicStates,
  remoteSpeakerStates,
}: VideoGridProps) => {
  const currentUserId = useCurrentUserId() ?? "";
  const currentUsername =
    users.find((user) => user.id === currentUserId)?.username ??
    storage.getUsername() ??
    "";

  return (
    <div
      className="grid auto-rows-[1fr] gap-2 overflow-y-auto"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
      }}
    >
      {/* Local video */}
      <div className="relative">
        <div className="relative aspect-video bg-black/10 dark:bg-black/30">
          <video
            autoPlay
            className="size-full scale-x-[-1] object-cover"
            muted
            playsInline
            ref={videoRef}
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar
                showTooltip={false}
                size="lg"
                user={{
                  id: currentUserId,
                  username: currentUsername,
                }}
              />
            </div>
          )}
          <VideoControls
            isLocal={true}
            micOn={micOn}
            remoteMicStates={remoteMicStates}
            remoteSpeakerStates={remoteSpeakerStates}
            speakersOn={speakerOn}
            userId={currentUserId}
          />
          <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-black/50 px-2 py-1 text-sm text-white">
            {currentUsername} (you)
          </div>
        </div>
      </div>

      {/* Remote videos */}
      {users
        .filter((user) => user.id !== currentUserId)
        .map((user) => {
          const stream = remoteStreams[user.id];
          const hasVideo = Boolean(stream?.getVideoTracks().length);
          return (
            <div className="relative" key={user.id}>
              <div className="relative aspect-video bg-black/10 dark:bg-black/30">
                {stream && (
                  <RemoteVideo
                    audioOutput={audioOutput}
                    muted={!speakerOn}
                    stream={stream}
                  />
                )}
                {!hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar showTooltip={false} size="lg" user={user} />
                  </div>
                )}
                <VideoControls
                  isLocal={false}
                  micOn={micOn}
                  remoteMicStates={remoteMicStates}
                  remoteSpeakerStates={remoteSpeakerStates}
                  speakersOn={speakerOn}
                  userId={user.id}
                />
                <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-black/50 px-2 py-1 text-sm text-white">
                  {user.username}
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
};
