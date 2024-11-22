import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Volume2, VolumeOff } from 'lucide-react';
import Peer from 'simple-peer';

import { storage } from '@/lib/services/storage';
import { userMap } from '@/lib/services/user-map';
import { getSocket } from '@/lib/socket';
import { Avatar } from '@/components/avatar';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const WebcamStream = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [speakersOn, setSpeakersOn] = useState(false);
  const [peers, setPeers] = useState<{ [key: string]: Peer.Instance }>({});
  const [remoteStreams, setRemoteStreams] = useState<{
    [key: string]: MediaStream;
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
      socket.emit('stream-ready');
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  }, [socket]);

  // Initialize peer connection with existing stream
  const initPeer = useCallback(
    (userID: string, initiator: boolean) => {
      const peer = new Peer({
        initiator,
        trickle: false,
        ...(streamRef.current && { stream: streamRef.current }),
      });

      // Handle receiving signal from remote peer
      peer.on('signal', (signal) => {
        socket.emit('signal', {
          userID,
          signal,
        });
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
        console.error('Peer connection error:', err);
        // Clean up the problematic peer connection
        if (peersRef.current[userID]) {
          peersRef.current[userID].destroy();
          delete peersRef.current[userID];
          setPeers((prev) => {
            const newPeers = { ...prev };
            delete newPeers[userID];
            return newPeers;
          });
        }
      });

      // Store peer in refs and state
      peersRef.current[userID] = peer;
      setPeers((prev) => ({ ...prev, [userID]: peer }));

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
        socket.emit('camera-off');

        // Clean up peer connections
        Object.values(peersRef.current).forEach((peer) => {
          peer.destroy();
        });
        peersRef.current = {};
        setPeers({});
        setRemoteStreams({});
        streamRef.current = null;
        setCameraOn(false);
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
    }
  };

  // Handle socket events
  useEffect(() => {
    // When a new user joins and is ready to stream
    socket.on('user-ready', (userID: string) => {
      console.log('New user ready:', userID);
      initPeer(userID, true);
    });

    // When receiving a signal from another peer
    socket.on('signal', ({ userID, signal }) => {
      console.log('Received signal from:', userID);
      if (peersRef.current[userID]) {
        peersRef.current[userID].signal(signal);
      } else {
        const peer = initPeer(userID, false);
        peer.signal(signal);
      }
    });

    // When a user disconnects or turns off their camera
    socket.on('user-disconnected', (userID: string) => {
      console.log('User disconnected:', userID);
      if (peersRef.current[userID]) {
        peersRef.current[userID].destroy();
        delete peersRef.current[userID];
        setPeers((prev) => {
          const newPeers = { ...prev };
          delete newPeers[userID];
          return newPeers;
        });
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    // Clean up function
    return () => {
      socket.off('user-ready');
      socket.off('signal');
      socket.off('user-disconnected');

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
      <div className="flex flex-wrap gap-2 overflow-y-auto">
        {/* Local video */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="aspect-video scale-x-[-1] rounded-lg bg-black/40 object-cover"
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
          <div className="absolute bottom-2 left-2 truncate rounded bg-black/50 px-1 py-px text-white">
            {userMap.get(storage.getUserId() ?? '')} (You)
          </div>
        </div>

        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([userID, stream]) => (
          <div key={userID} className="relative">
            <video
              autoPlay
              playsInline
              className="aspect-video scale-x-[-1] rounded-lg bg-gray-900 object-cover"
              ref={(el) => {
                if (el) {
                  el.srcObject = stream;
                }
              }}
            />
            <div className="absolute bottom-4 left-4 rounded bg-black/50 px-2 py-1 text-white">
              Remote User: {userID}
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
