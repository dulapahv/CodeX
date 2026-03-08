/**
 * Custom hook for managing WebRTC peer connections and remote streams.
 * Handles peer creation, cleanup, and signal processing.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useRef, useState } from "react";

import type Peer from "simple-peer";

export const usePeerConnections = () => {
  const [remoteStreams, setRemoteStreams] = useState<
    Record<string, MediaStream | null>
  >({});
  const [remoteMicStates, setRemoteMicStates] = useState<
    Record<string, boolean>
  >({});
  const [remoteSpeakerStates, setRemoteSpeakerStates] = useState<
    Record<string, boolean>
  >({});

  const peersRef = useRef<Record<string, Peer.Instance>>({});
  const pendingSignalsRef = useRef<Record<string, Peer.SignalData[]>>({});

  return {
    remoteStreams,
    remoteMicStates,
    remoteSpeakerStates,
    peersRef,
    pendingSignalsRef,
    setRemoteStreams,
    setRemoteMicStates,
    setRemoteSpeakerStates,
  };
};
