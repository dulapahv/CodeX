/**
 * Custom hook for managing Socket.IO events related to webcam streaming.
 * Handles signaling, state synchronization, and user connection events.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { RoomServiceMsg, StreamServiceMsg } from "@codex/types/message";
import { useEffect, useRef } from "react";
import type Peer from "simple-peer";

import { storage } from "@/lib/services/storage";
import { getSocket } from "@/lib/socket";

import { cleanupPeer, createPeer, handleSignal } from "../utils/peer";

interface UseSocketEventsProps {
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
  speakerOn,
  streamRef,
  peersRef,
  pendingSignalsRef,
  setRemoteStreams,
  setRemoteMicStates,
  setRemoteSpeakerStates,
}: UseSocketEventsProps) => {
  const socket = getSocket();

  // Use a ref for speakerOn so the one-time effect always has the latest value
  const speakerOnRef = useRef(speakerOn);
  speakerOnRef.current = speakerOn;

  // One-time setup: emit STREAM_READY and register all socket event handlers.
  // This effect runs only once on mount and cleans up on unmount.
  // biome-ignore lint/correctness/useExhaustiveDependencies: refs and socket are stable, one-time setup on mount
  useEffect(() => {
    // Notify other users that we're ready for peer connections
    socket.emit(StreamServiceMsg.STREAM_READY);
    socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOnRef.current);

    // When another user is ready, create an initiator peer for them
    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      createPeer(
        userID,
        true,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      );
      socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOnRef.current);
    });

    // Handle incoming WebRTC signals (offers, answers, ICE candidates)
    socket.on(StreamServiceMsg.SIGNAL, ({ userID, signal }) => {
      handleSignal(
        signal as Peer.SignalData,
        userID,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      );
    });

    // Track remote mic states
    socket.on(
      StreamServiceMsg.MIC_STATE,
      ({ userID, micOn }: { userID: string; micOn: boolean }) => {
        setRemoteMicStates((prev) => ({ ...prev, [userID]: micOn }));
      }
    );

    // Track remote speaker states
    socket.on(
      StreamServiceMsg.SPEAKER_STATE,
      ({ userID, speakersOn }: { userID: string; speakersOn: boolean }) => {
        setRemoteSpeakerStates((prev) => ({ ...prev, [userID]: speakersOn }));
      }
    );

    // Remote user turned off their camera - remove their stream but keep peer
    socket.on(StreamServiceMsg.CAMERA_OFF, (userID: string) => {
      if (userID !== storage.getUserId()) {
        setRemoteStreams((prev) => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    // Clean up peer when a user leaves the room
    socket.on(RoomServiceMsg.LEAVE, (customId: string) => {
      cleanupPeer(customId, peersRef, setRemoteStreams);
      setRemoteMicStates((prev) => {
        const newStates = { ...prev };
        delete newStates[customId];
        return newStates;
      });
      setRemoteSpeakerStates((prev) => {
        const newStates = { ...prev };
        delete newStates[customId];
        return newStates;
      });
    });

    return () => {
      // Stop local media tracks
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }

      // Destroy all peer connections
      for (const userID of Object.keys(peersRef.current)) {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      }

      // Notify others that our camera is off
      socket.emit(StreamServiceMsg.CAMERA_OFF);

      // Remove all event listeners
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.MIC_STATE);
      socket.off(StreamServiceMsg.SPEAKER_STATE);
      socket.off(StreamServiceMsg.CAMERA_OFF);
      socket.off(RoomServiceMsg.LEAVE);
    };
  }, []);

  // Broadcast speaker state changes separately from the main setup effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: socket is stable
  useEffect(() => {
    socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
  }, [speakerOn]);
};
