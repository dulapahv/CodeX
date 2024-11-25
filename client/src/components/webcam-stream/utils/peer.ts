import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import Peer from 'simple-peer';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { parseError } from '@/lib/utils';

// Create a new peer connection
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

    // Create peer with or without local stream
    const peer = new Peer({
      initiator,
      stream: streamRef.current || undefined,
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
      // if (!err.message.includes('state')) {
      //   toast.error(`Peer connection error:\n${parseError(err)}`);
      // }
      console.warn(`Peer connection error:\n${parseError(err)}`);
      cleanupPeer(userID, peersRef, setRemoteStreams);
    });

    // Process any pending signals
    const pendingSignals = pendingSignalsRef.current[userID] || [];
    pendingSignals.forEach((signal) => {
      try {
        peer.signal(signal);
      } catch (error) {
        toast.warning(
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

// Handle incoming signals
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
      if (!pendingSignalsRef.current[userID]) {
        pendingSignalsRef.current[userID] = [];
      }
      pendingSignalsRef.current[userID].push(signal);
      peer = createPeer(
        userID,
        false,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
      ) as Peer.Instance;
    } else {
      peer.signal(signal);
    }
  } catch (error) {
    toast.error(`Error handling peer signal:\n${parseError(error)}`);
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
        peer.destroy();
      } catch (error) {
        toast.warning(`Error destroying peer connection for ${userID}`);
      }
    }
    delete peersRef.current[userID];
    setRemoteStreams((prev) => {
      const newStreams = { ...prev };
      delete newStreams[userID];
      return newStreams;
    });
  }
};
