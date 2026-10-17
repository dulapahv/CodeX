/**
 * Video grid component that displays local and remote video streams.
 * Renders video elements with user avatars and control overlays.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { PresenceMedia } from "@codex/types/realtime";
import type { User } from "@codex/types/user";

import { Avatar } from "@/components/avatar";
import { useCurrentUserId } from "@/hooks/use-current-user-id";
import { storage } from "@/lib/services/storage";

import { useRemoteTrack } from "../call-provider";
import { TrackVideo } from "./track-video";
import { VideoControls } from "./video-controls";

const VIDEO_CLASS = "size-full scale-x-[-1] object-cover";

interface RemoteTileProps {
  media: PresenceMedia | undefined;
  micOn: boolean;
  remoteMicStates: Record<string, boolean>;
  remoteSpeakerStates: Record<string, boolean>;
  speakerOn: boolean;
  user: User;
}

const RemoteTile = ({
  media,
  micOn,
  remoteMicStates,
  remoteSpeakerStates,
  speakerOn,
  user,
}: RemoteTileProps) => {
  const cameraOn = media?.camera ?? false;
  const track = useRemoteTrack(media?.tracks?.video);

  return (
    <div className="relative">
      <div className="relative aspect-video bg-black/10 dark:bg-black/30">
        {cameraOn && track ? (
          <TrackVideo className={VIDEO_CLASS} track={track} />
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
        <div className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate bg-black/50 px-2 py-1 text-sm text-white">
          {user.username}
        </div>
      </div>
    </div>
  );
};

interface VideoGridProps {
  cameraOn: boolean;
  localTrack: MediaStreamTrack | undefined;
  media: Record<string, PresenceMedia>;
  micOn: boolean;
  speakerOn: boolean;
  users: User[];
}

export const VideoGrid = ({
  cameraOn,
  localTrack,
  media,
  micOn,
  speakerOn,
  users,
}: VideoGridProps) => {
  const currentUserId = useCurrentUserId() ?? "";
  const currentUsername =
    users.find((user) => user.id === currentUserId)?.username ??
    storage.getUsername() ??
    "";

  const remoteMicStates = Object.fromEntries(
    Object.entries(media).map(([id, state]) => [id, state.mic])
  );
  const remoteSpeakerStates = Object.fromEntries(
    Object.entries(media).map(([id, state]) => [id, state.speaker])
  );

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
          {cameraOn && localTrack ? (
            <TrackVideo className={VIDEO_CLASS} track={localTrack} />
          ) : (
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
        .map((user) => (
          <RemoteTile
            key={user.id}
            media={media[user.id]}
            micOn={micOn}
            remoteMicStates={remoteMicStates}
            remoteSpeakerStates={remoteSpeakerStates}
            speakerOn={speakerOn}
            user={user}
          />
        ))}
    </div>
  );
};
