import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeOff } from 'lucide-react';
import Peer from 'simple-peer';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';
import type { User } from '@common/types/user';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { parseError } from '@/lib/utils';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface WebcamStreamProps {
  users: User[];
}

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakersOn, setSpeakersOn] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState<{
    [key: string]: MediaStream | null;
  }>({});

  const socket = getSocket();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({}); // Keep track of peers in a ref

  // Get local media stream
  const getMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Notify other clients in the room that we're ready to stream
      socket.emit(StreamServiceMsg.STREAM_READY);
    } catch (error) {
      toast.error(`Error accessing media devices.\n${parseError(error)}`);
    }
  }, [socket]);

  // Initialize peer connection with existing stream
  const initPeer = useCallback(
    (userID: string, initiator: boolean) => {
      const peer = new Peer({
        initiator,
        ...(streamRef.current && { stream: streamRef.current }),
      });

      // Handle receiving signal from remote peer
      peer.on('signal', (signal) => {
        socket.emit(StreamServiceMsg.SIGNAL, signal);
      });

      // Handle receiving remote stream
      peer.on('stream', (stream) => {
        setRemoteStreams((prev) => ({
          ...prev,
          [userID]: stream,
        }));
      });

      // Handle peer errors
      peer.on('error', (err) => {
        toast.error(`Peer connection error:\n${parseError(err)}`);
        // Clean up the problematic peer connection
        if (peersRef.current[userID]) {
          peersRef.current[userID].destroy();
          delete peersRef.current[userID];
        }
      });

      // Store peer in refs and state
      peersRef.current[userID] = peer;

      return peer;
    },
    [socket],
  );

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (!cameraOn) {
        await getMedia();
        setCameraOn(true);
      } else {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Notify peers that camera is turning off
        socket.emit(StreamServiceMsg.CAMERA_OFF);

        // Clean up peer connections
        Object.values(peersRef.current).forEach((peer) => {
          peer.destroy();
        });
        peersRef.current = {};
        setRemoteStreams({});
        streamRef.current = null;
        setCameraOn(false);
      }
    } catch (error) {
      toast.error(`Error toggling camera.\n${parseError(error)}`);
    }
  };

  // Handle socket events
  useEffect(() => {
    // When a new user joins and is ready to stream
    socket.on(StreamServiceMsg.USER_READY, (userID: string) =>
      initPeer(userID, true),
    );

    // When receiving a signal from another peer
    socket.on(StreamServiceMsg.SIGNAL, ({ userID, signal }) => {
      if (peersRef.current[userID]) {
        peersRef.current[userID].signal(signal);
      } else {
        const peer = initPeer(userID, false);
        peer.signal(signal);
      }
    });

    // When a user disconnects or turns off their camera
    socket.on(StreamServiceMsg.USER_DISCONNECTED, (userID: string) => {
      if (peersRef.current[userID]) {
        peersRef.current[userID].destroy();
        delete peersRef.current[userID];
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    // Clean up function
    return () => {
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.USER_DISCONNECTED);

      // Clean up all streams and connections
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
      peersRef.current = {};
    };
  }, [socket, initPeer]);

  return (
    <div className="relative flex h-full flex-col gap-4 bg-[color:var(--panel-background)]">
      <div className="flex flex-wrap gap-2 p-2">
        {/* Local video */}
        <div className="relative min-w-[200px] flex-1">
          <div className="relative aspect-video w-full rounded-lg bg-black/40">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full scale-x-[-1] rounded-lg object-cover"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar
                  user={{
                    id: storage.getUserId() ?? '',
                    username: userMap.get(storage.getUserId() ?? '') ?? '',
                  }}
                  size="lg"
                />
              </div>
            )}
            <div className="absolute bottom-2 left-2 truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
              {userMap.get(storage.getUserId() ?? '')} (You)
            </div>
          </div>
        </div>

        {/* Remote videos */}
        {users
          .filter((user) => user.id !== storage.getUserId())
          .map((user) => (
            <div key={user.id} className="relative min-w-[200px] flex-1">
              <div className="relative aspect-video w-full rounded-lg bg-black/40">
                {remoteStreams[user.id] ? (
                  <video
                    autoPlay
                    playsInline
                    className="h-full w-full scale-x-[-1] rounded-lg object-cover"
                    ref={(element) => {
                      if (element) element.srcObject = remoteStreams[user.id];
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Avatar user={user} size="lg" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 truncate rounded bg-black/50 px-2 py-1 text-sm text-white">
                  {user.username}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={toggleCamera}
              variant={cameraOn ? 'default' : 'secondary'}
              size="icon"
              aria-label={cameraOn ? 'Turn off camera' : 'Turn on camera'}
              type="button"
              aria-haspopup="dialog"
            >
              {cameraOn ? (
                <Video className="size-5" />
              ) : (
                <VideoOff className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {cameraOn ? 'Turn off camera' : 'Turn on camera'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setMicOn((prev) => !prev)}
              variant={micOn ? 'default' : 'secondary'}
              size="icon"
              aria-label={micOn ? 'Turn off microphone' : 'Turn on microphone'}
              type="button"
              aria-haspopup="dialog"
            >
              {micOn ? (
                <Mic className="size-5" />
              ) : (
                <MicOff className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {micOn ? 'Turn off microphone' : 'Turn on microphone'}
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={() => setSpeakersOn((prev) => !prev)}
              variant={speakersOn ? 'default' : 'secondary'}
              size="icon"
              aria-label={speakersOn ? 'Turn off speakers' : 'Turn on speakers'}
              type="button"
              aria-haspopup="dialog"
            >
              {speakersOn ? (
                <Volume2 className="size-5" />
              ) : (
                <VolumeOff className="size-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {speakersOn ? 'Turn off speakers' : 'Turn on speakers'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};

export { WebcamStream };
