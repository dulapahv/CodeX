/**
 * Custom hook for managing Socket.IO events related to webcam streaming.
 * Handles signaling, state synchronization, and user connection events.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import { useEffect } from "react";
import type Peer from "simple-peer";

import { storage } from "@/lib/services/storage";
import { getSocket } from "@/lib/socket";

import { cleanupPeer, createPeer, handleSignal } from "../utils/peer";

interface UseSocketEventsProps {
  hasRequestedPermissions: boolean;
  peersRef: React.RefObject<Record<string, Peer.Instance>>;
  pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>;
  setRemoteMicStates: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setRemoteSpeakerStates: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setRemoteStreams: React.Dispatch<
    React.SetStateAction<Record<string, MediaStream | null>>
  >;
  speakerOn: boolean;
  streamRef: React.RefObject<MediaStream | null>;
}

export const useSocketEvents = ({
  hasRequestedPermissions,
  speakerOn,
  streamRef,
  peersRef,
  pendingSignalsRef,
  setRemoteStreams,
  setRemoteMicStates,
  setRemoteSpeakerStates,
}: UseSocketEventsProps) => {
  const socket = getSocket();

  // biome-ignore lint/correctness/useExhaustiveDependencies: refs and socket methods are stable, only re-run on permission/speaker changes
  useEffect(() => {
    if (hasRequestedPermissions) {
      socket.emit(StreamServiceMsg.STREAM_READY);
      socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
    }

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      if (hasRequestedPermissions) {
        createPeer(
          userID,
          true,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef
        );
        socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
      }
    });

    socket.on(
      StreamServiceMsg.MIC_STATE,
      ({ userID, micOn }: { userID: string; micOn: boolean }) => {
        setRemoteMicStates((prev) => ({ ...prev, [userID]: micOn }));
      }
    );

    socket.on(
      StreamServiceMsg.SPEAKER_STATE,
      ({ userID, speakersOn }: { userID: string; speakersOn: boolean }) => {
        setRemoteSpeakerStates((prev) => ({ ...prev, [userID]: speakersOn }));
      }
    );

    socket.on(StreamServiceMsg.SIGNAL, ({ userID, signal }) => {
      if (hasRequestedPermissions) {
        handleSignal(
          signal as Peer.SignalData,
          userID,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef
        );
      }
    });

    socket.on(StreamServiceMsg.CAMERA_OFF, (userID: string) => {
      if (userID !== storage.getUserId()) {
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    return () => {
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.MIC_STATE);
      socket.off(StreamServiceMsg.SPEAKER_STATE);
      socket.off(StreamServiceMsg.CAMERA_OFF);
    };
  }, [hasRequestedPermissions, speakerOn]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup only on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
      for (const userID of Object.keys(peersRef.current)) {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      }
      socket.emit(StreamServiceMsg.CAMERA_OFF);
    };
  }, []);
};
