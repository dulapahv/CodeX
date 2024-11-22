import React, { useCallback, useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { Camera, CameraOff } from 'lucide-react';

import { getSocket } from '@/lib/socket';
import { Button } from '@/components/ui/button';

const WebcamStream = () => {
  const [cameraOn, setCameraOn] = useState(false);
  const [peers, setPeers] = useState<{ [key: string]: Peer.Instance }>({});
  const [remoteStreams, setRemoteStreams] = useState<{ [key: string]: MediaStream }>({});
  
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
  const initPeer = useCallback((userID: string, initiator: boolean) => {
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
      setRemoteStreams(prev => ({
        ...prev,
        [userID]: stream
      }));
    });

    // Handle peer errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
      // Clean up the problematic peer connection
      if (peersRef.current[userID]) {
        peersRef.current[userID].destroy();
        delete peersRef.current[userID];
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userID];
          return newPeers;
        });
      }
    });

    // Store peer in refs and state
    peersRef.current[userID] = peer;
    setPeers(prev => ({ ...prev, [userID]: peer }));

    return peer;
  }, [socket]);

  // Toggle camera
  const toggleCamera = async () => {
    try {
      if (!cameraOn) {
        await getMedia();
        setCameraOn(true);
      } else {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
        
        // Notify peers that camera is turning off
        socket.emit('camera-off');
        
        // Clean up peer connections
        Object.values(peersRef.current).forEach(peer => {
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
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userID];
          return newPeers;
        });
        setRemoteStreams(prev => {
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
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(peer => peer.destroy());
      peersRef.current = {};
    };
  }, [socket, initPeer]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Local video */}
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
          />
          <div className="absolute bottom-4 left-4">
            <Button 
              onClick={toggleCamera}
              variant={cameraOn ? "destructive" : "default"}
              size="sm"
            >
              {cameraOn ? (
                <>
                  <CameraOff className="w-4 h-4 mr-2" />
                  Turn off camera
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Turn on camera
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Remote videos */}
        {Object.entries(remoteStreams).map(([userID, stream]) => (
          <div key={userID} className="relative">
            <video
              autoPlay
              playsInline
              className="w-full h-64 bg-gray-900 rounded-lg object-cover"
              ref={el => {
                if (el) {
                  el.srcObject = stream;
                }
              }}
            />
            <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded">
              Remote User: {userID}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { WebcamStream };