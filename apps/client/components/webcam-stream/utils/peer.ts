/**
 * WebRTC peer connection utilities for video/audio streaming.
 * Features:
 * - Peer creation and cleanup
 * - Targeted signal routing
 * - Stream handling
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import type { Dispatch, RefObject, SetStateAction } from "react";
import Peer from "simple-peer";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

// Create a new peer connection for a specific user
export const createPeer = (
  userID: string,
  initiator: boolean,
  streamRef: RefObject<MediaStream | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>
) => {
  const socket = getSocket();
  try {
    // Clean up existing peer if it exists
    cleanupPeer(userID, peersRef, setRemoteStreams);

    // Create peer with stream config
    const peer = new Peer({
      initiator,
      // Only include stream if it exists and has active tracks
      stream: streamRef.current?.getTracks().length
        ? streamRef.current
        : undefined,
    });

    // Send signals to the specific target user, not broadcast
    peer.on("signal", (signal) => {
      socket.emit(StreamServiceMsg.SIGNAL, { signal, targetUserID: userID });
    });

    peer.on("stream", (stream) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [userID]: stream,
      }));
    });

    peer.on("error", (err) => {
      console.warn(`Peer connection error:\n${parseError(err)}`);
      cleanupPeer(userID, peersRef, setRemoteStreams);
    });

    peer.on("connect", () => {
      console.log(`Peer connection established with ${userID}`);
    });

    // Store peer before processing pending signals
    peersRef.current[userID] = peer;

    // Process any pending signals
    const pendingSignals = pendingSignalsRef.current[userID] || [];
    for (const signal of pendingSignals) {
      try {
        peer.signal(signal);
      } catch (error) {
        console.warn(
          `Error processing pending signal for ${userID}:\n${error}`
        );
      }
    }
    delete pendingSignalsRef.current[userID];

    return peer;
  } catch (error) {
    toast.error(`Error creating peer connection:\n${parseError(error)}`);
    return null;
  }
};

// Handle incoming signals from a specific user
export const handleSignal = (
  signal: Peer.SignalData,
  userID: string,
  streamRef: RefObject<MediaStream | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>
) => {
  try {
    const existingPeer = peersRef.current[userID];

    // If we receive an offer but already have a peer, the remote side is
    // re-establishing the connection (e.g. after toggling camera or reload).
    // Clean up our old peer to accept the new connection.
    if (
      existingPeer &&
      !existingPeer.destroyed &&
      (signal as { type?: string }).type === "offer"
    ) {
      cleanupPeer(userID, peersRef, setRemoteStreams);
    }

    const peer = peersRef.current[userID];

    if (!peer || peer.destroyed) {
      // Queue signal and create new non-initiator peer
      if (!pendingSignalsRef.current[userID]) {
        pendingSignalsRef.current[userID] = [];
      }
      pendingSignalsRef.current[userID].push(signal);

      // createPeer processes pending signals internally, so we return
      // to avoid double-processing the signal
      createPeer(
        userID,
        false,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      );
      return;
    }

    // Peer exists and is healthy, signal directly
    peer.signal(signal);
  } catch (error) {
    console.error(`Error handling peer signal:\n${parseError(error)}`);
  }
};

// Clean up a peer connection
export const cleanupPeer = (
  userID: string,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<SetStateAction<Record<string, MediaStream | null>>>
) => {
  const peer = peersRef.current[userID];
  if (peer) {
    if (!peer.destroyed) {
      try {
        peer.destroy();
      } catch (error) {
        console.warn(
          `Error destroying peer connection for ${userID}.\n${error}`
        );
      }
    }
    delete peersRef.current[userID];
  }

  // Always clean up remote streams for this user
  setRemoteStreams((prev) => {
    const newStreams = { ...prev };
    delete newStreams[userID];
    return newStreams;
  });
};
