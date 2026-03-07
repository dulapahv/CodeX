/**
 * Video grid component that displays local and remote video streams.
 * Renders video elements with user avatars and control overlays.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { RefObject } from 'react';

import type { User } from '@codex/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { Avatar } from '@/components/avatar';

import { VideoControls } from './video-controls';

interface VideoGridProps {
  users: User[];
  cameraOn: boolean;
  micOn: boolean;
  speakerOn: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  remoteStreams: Record<string, MediaStream | null>;
  remoteMicStates: Record<string, boolean>;
  remoteSpeakerStates: Record<string, boolean>;
}

export const VideoGrid = ({
  users,
  cameraOn,
  micOn,
  speakerOn,
  videoRef,
  remoteStreams,
  remoteMicStates,
  remoteSpeakerStates
}: VideoGridProps) => {
  const currentUserId = storage.getUserId() ?? '';
  const currentUsername = userMap.get(currentUserId) ?? '';

  return (
    <div
      className="grid auto-rows-[1fr] gap-2 overflow-y-auto"
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'
      }}
    >
      {/* Local video */}
      <div className="relative">
        <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="size-full scale-x-[-1] rounded-lg object-cover"
          />
          {!cameraOn && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar
                user={{
                  id: currentUserId,
                  username: currentUsername
                }}
                size="lg"
                showTooltip={false}
              />
            </div>
          )}
          <VideoControls
            isLocal={true}
            userId={currentUserId}
            micOn={micOn}
            speakersOn={speakerOn}
            remoteMicStates={remoteMicStates}
            remoteSpeakerStates={remoteSpeakerStates}
          />
          <div
            className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm
              text-white"
          >
            {currentUsername} (you)
          </div>
        </div>
      </div>

      {/* Remote videos */}
      {users
        .filter(user => user.id !== currentUserId)
        .map(user => (
          <div key={user.id} className="relative">
            <div className="relative aspect-video rounded-lg bg-black/10 dark:bg-black/30">
              {remoteStreams[user.id] ? (
                <video
                  autoPlay
                  playsInline
                  muted={!speakerOn}
                  className="size-full scale-x-[-1] rounded-lg object-cover"
                  ref={element => {
                    if (element) element.srcObject = remoteStreams[user.id];
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Avatar user={user} size="lg" showTooltip={false} />
                </div>
              )}
              <VideoControls
                isLocal={false}
                userId={user.id}
                micOn={micOn}
                speakersOn={speakerOn}
                remoteMicStates={remoteMicStates}
                remoteSpeakerStates={remoteSpeakerStates}
              />
              <div
                className="absolute bottom-2 left-2 max-w-[calc(100%-1rem)] truncate rounded bg-black/50 px-2 py-1 text-sm
                  text-white"
              >
                {user.username}
              </div>
            </div>
          </div>
        ))}
    </div>
  );
};
