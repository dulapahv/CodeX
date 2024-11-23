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
  const peersRef = useRef<{ [key: string]: Peer.Instance }>({});

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

      // Update existing peer connections with the new stream
      Object.entries(peersRef.current).forEach(([userID, peer]) => {
        if (!peer.destroyed) {
          streamRef.current?.getTracks().forEach((track) => {
            try {
              peer.addTrack(track, streamRef.current!);
            } catch (error) {
              console.error(`Error adding track for peer ${userID}:`, error);
              // If we can't add tracks, recreate the peer
              cleanupPeer(userID);
              createPeer(userID, true);
            }
          });
        }
      });

      // Notify other clients in the room that we're ready to stream
      socket.emit(StreamServiceMsg.STREAM_READY);
    } catch (error) {
      toast.error(`Error accessing media devices.\n${parseError(error)}`);
    }
  }, [socket]);

  // Initialize peer connections without media
  const initializePeerConnections = useCallback(() => {
    socket.emit(StreamServiceMsg.STREAM_READY);
  }, [socket]);

  // Create a new peer connection
  const createPeer = useCallback(
    (userID: string, initiator: boolean) => {
      try {
        // Clean up existing peer if it exists
        cleanupPeer(userID);

        const peer = new Peer({
          initiator,
          // Initialize peer with or without stream
          ...(streamRef.current && { stream: streamRef.current }),
        });

        peer.on('signal', (signal) => {
          socket.emit(StreamServiceMsg.SIGNAL, signal);
        });

        peer.on('stream', (stream) => {
          setRemoteStreams((prev) => ({
            ...prev,
            [userID]: stream,
          }));
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
          toast.error(`Peer connection error:\n${parseError(err)}`);
          cleanupPeer(userID);
        });

        peersRef.current[userID] = peer;
        return peer;
      } catch (error) {
        console.error('Error creating peer:', error);
        toast.error(`Error creating peer connection:\n${parseError(error)}`);
        return null;
      }
    },
    [socket],
  );

  // Clean up a peer connection
  const cleanupPeer = useCallback((userID: string) => {
    const peer = peersRef.current[userID];
    if (peer) {
      if (!peer.destroyed) {
        try {
          // Remove all tracks before destroying
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              try {
                peer.removeTrack(track, streamRef.current!);
              } catch (error) {
                console.warn(
                  `Error removing track from peer ${userID}:`,
                  error,
                );
              }
            });
          }
          peer.destroy();
        } catch (error) {
          console.warn(`Error destroying peer ${userID}:`, error);
        }
      }
      delete peersRef.current[userID];
      setRemoteStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[userID];
        return newStreams;
      });
    }
  }, []);

  // Handle incoming signals
  const handleSignal = useCallback(
    (userID: string, signal: any) => {
      try {
        let peer = peersRef.current[userID];

        if (!peer || peer.destroyed) {
          peer = createPeer(userID, false) as Peer.Instance;
        }

        if (peer) {
          peer.signal(signal);
        }
      } catch (error) {
        console.error('Error handling signal:', error);
        toast.error(`Error handling peer signal:\n${parseError(error)}`);
      }
    },
    [createPeer],
  );

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (!cameraOn) {
        await getMedia();
        setCameraOn(true);
      } else {
        if (streamRef.current) {
          // Remove tracks from peer connections before stopping them
          Object.entries(peersRef.current).forEach(([userID, peer]) => {
            if (!peer.destroyed) {
              streamRef.current?.getTracks().forEach((track) => {
                try {
                  peer.removeTrack(track, streamRef.current!);
                } catch (error) {
                  console.warn(
                    `Error removing track from peer ${userID}:`,
                    error,
                  );
                }
              });
            }
          });

          // Stop all tracks
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }

        // Notify other peers about camera state
        socket.emit(StreamServiceMsg.CAMERA_OFF);

        streamRef.current = null;
        setCameraOn(false);
      }
    } catch (error) {
      toast.error(`Error toggling camera.\n${parseError(error)}`);
    }
  };

  // Handle socket events
  useEffect(() => {
    // Initialize peer connections without media when component mounts
    initializePeerConnections();

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      console.log('User ready:', userID);
      createPeer(userID, true);
    });

    socket.on(
      StreamServiceMsg.SIGNAL,
      ({ userID, signal }: { userID: string; signal: any }) => {
        console.log('Received signal from:', userID);
        handleSignal(userID, signal);
      },
    );

    socket.on(StreamServiceMsg.USER_DISCONNECTED, (userID: string) => {
      console.log('User disconnected:', userID);
      cleanupPeer(userID);
    });

    return () => {
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.USER_DISCONNECTED);

      // Clean up all peers and media streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.keys(peersRef.current).forEach(cleanupPeer);
    };
  }, [
    socket,
    createPeer,
    handleSignal,
    cleanupPeer,
    initializePeerConnections,
  ]);

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
