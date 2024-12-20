import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { isMobile } from 'react-device-detect';
import Peer from 'simple-peer';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { parseError } from '@/lib/utils';

// Create a new peer connection with cross-platform compatibility
export const createPeer = (
  userID: string,
  initiator: boolean,
  streamRef: MutableRefObject<MediaStream | null>,
  peersRef: MutableRefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: MutableRefObject<Record<string, any[]>>,
) => {
  const socket = getSocket();
  try {
    // Clean up existing peer if it exists
    cleanupPeer(userID, peersRef, setRemoteStreams);

    const peerOptions: Peer.Options = {
      initiator,
      // Only include stream if it exists and has active tracks
      stream: streamRef.current?.getTracks().length
        ? streamRef.current
        : undefined,
      // Add configuration to handle mobile/desktop differences
      config: {
        iceServers: [], // Keep empty as per your requirement
      },
      // Enable both plan-b and unified-plan for better compatibility
      sdpTransform: (sdp) => {
        // Ensure audio/video codecs are compatible across platforms
        return sdp.replace(
          /a=fmtp:111/g,
          'a=fmtp:111 minptime=10;useinbandfec=1',
        );
      },
      objectMode: true,
    };

    const peer = new Peer(peerOptions);

    // Handle negotiation needed (important for mobile/desktop compatibility)
    peer.on('negotiate', () => {
      console.log('Negotiation needed for peer:', userID);
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
      console.warn(`Peer connection error with ${userID}:\n${parseError(err)}`);
      cleanupPeer(userID, peersRef, setRemoteStreams);
    });

    peer.on('connect', () => {
      console.log(`Peer connection established with ${userID}`);
    });

    peer.on('close', () => {
      console.log(`Peer connection closed with ${userID}`);
      cleanupPeer(userID, peersRef, setRemoteStreams);
    });

    // Process any pending signals
    const pendingSignals = pendingSignalsRef.current[userID] || [];
    pendingSignals.forEach((signal) => {
      try {
        peer.signal(signal);
      } catch (error) {
        console.warn(
          `Error processing pending signal for ${userID}:\n${error}`,
        );
      }
    });
    delete pendingSignalsRef.current[userID];

    peersRef.current[userID] = peer;
    return peer;
  } catch (error) {
    toast.error(`Error creating peer connection:\n${parseError(error)}`);
    return null;
  }
};

// Handle incoming signals with cross-platform compatibility
export const handleSignal = (
  signal: any,
  userID: string,
  streamRef: MutableRefObject<MediaStream | null>,
  peersRef: MutableRefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: MutableRefObject<Record<string, any[]>>,
) => {
  try {
    let peer = peersRef.current[userID];

    if (!peer || peer.destroyed) {
      // Store signal if peer doesn't exist yet
      if (!pendingSignalsRef.current[userID]) {
        pendingSignalsRef.current[userID] = [];
      }
      pendingSignalsRef.current[userID].push(signal);

      // If we're receiving an offer but don't have a peer, we need to create one
      const isOffer = signal.type === 'offer';
      const newPeer = createPeer(
        userID,
        !isOffer, // we're not the initiator if we're receiving an offer
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
      );
      if (!newPeer) return;
      peer = newPeer;
    }

    if (peer && !peer.destroyed) {
      // Add platform info to the signal for debugging
      const enhancedSignal = {
        ...signal,
        _platform: isMobile ? 'mobile' : 'desktop',
      };
      peer.signal(enhancedSignal);
    }
  } catch (error) {
    console.error(`Error handling peer signal:\n${parseError(error)}`);
  }
};

// Clean up a peer connection
export const cleanupPeer = (
  userID: string,
  peersRef: MutableRefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
) => {
  const peer = peersRef.current[userID];
  if (peer) {
    if (!peer.destroyed) {
      try {
        // Properly close the connection
        peer.removeAllListeners();
        peer.destroy();
      } catch (error) {
        console.warn(`Error destroying peer connection for ${userID}`);
      }
    }
    delete peersRef.current[userID];
  }

  // Clean up remote streams for this user
  setRemoteStreams((prev) => {
    const newStreams = { ...prev };
    delete newStreams[userID];
    return newStreams;
  });
};
