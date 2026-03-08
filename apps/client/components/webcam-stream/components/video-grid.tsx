/**
 * Video grid component that displays local and remote video streams.
 * Renders video elements with user avatars and control overlays.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";
import type { RefObject } from "react";
import { Avatar } from "@/components/avatar";
import { storage } from "@/lib/services/storage";
import { userMap } from "@/lib/services/user-map";

import { VideoControls } from "./video-controls";

interface VideoGridProps {
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
  users,
  cameraOn,
  micOn,
  speakerOn,
  videoRef,
  remoteStreams,
  remoteMicStates,
  remoteSpeakerStates,
}: VideoGridProps) => {
  const currentUserId = storage.getUserId() ?? "";
  const currentUsername = userMap.get(currentUserId) ?? "";

  return (
    <div
      className="grid auto-rows-[1fr] gap-2 overflow-y-auto"
      style={{
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
      }}
    >
      {/* Local video */}
      <div className="relative">
        <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
          <video
            autoPlay
            className="size-full scale-x-[-1] rounded-lg object-cover"
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
          <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
            {currentUsername} (you)
          </div>
        </div>
      </div>

      {/* Remote videos */}
      {users
        .filter((user) => user.id !== currentUserId)
        .map((user) => (
          <div className="relative" key={user.id}>
            <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
              {remoteStreams[user.id] ? (
                <video
                  autoPlay
                  className="size-full scale-x-[-1] rounded-lg object-cover"
                  muted={!speakerOn}
                  playsInline
                  ref={(element) => {
                    if (element) {
                      element.srcObject = remoteStreams[user.id];
                    }
                  }}
                />
              ) : (
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
              <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
                {user.username}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};
