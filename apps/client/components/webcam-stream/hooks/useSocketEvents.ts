/**
 * Custom hook for managing Socket.IO events related to webcam streaming.
 * Handles signaling, state synchronization, and user connection events.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useEffect } from 'react';

import type Peer from 'simple-peer';

import { StreamServiceMsg } from '@codex/types/message';

import { storage } from '@/lib/services/storage';
import { getSocket } from '@/lib/socket';

import { cleanupPeer, createPeer, handleSignal } from '../utils/peer';

interface UseSocketEventsProps {
  hasRequestedPermissions: boolean;
  speakerOn: boolean;
  streamRef: React.RefObject<MediaStream | null>;
  peersRef: React.RefObject<Record<string, Peer.Instance>>;
  pendingSignalsRef: React.RefObject<Record<string, unknown[]>>;
  setRemoteStreams: React.Dispatch<React.SetStateAction<Record<string, MediaStream | null>>>;
  setRemoteMicStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setRemoteSpeakerStates: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const useSocketEvents = ({
  hasRequestedPermissions,
  speakerOn,
  streamRef,
  peersRef,
  pendingSignalsRef,
  setRemoteStreams,
  setRemoteMicStates,
  setRemoteSpeakerStates
}: UseSocketEventsProps) => {
  const socket = getSocket();

  useEffect(() => {
    if (hasRequestedPermissions) {
      socket.emit(StreamServiceMsg.STREAM_READY);
      socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
    }

    socket.on(StreamServiceMsg.USER_READY, (userID: string) => {
      if (hasRequestedPermissions) {
        createPeer(userID, true, streamRef, peersRef, setRemoteStreams, pendingSignalsRef);
        socket.emit(StreamServiceMsg.SPEAKER_STATE, speakerOn);
      }
    });

    socket.on(
      StreamServiceMsg.MIC_STATE,
      ({ userID, micOn }: { userID: string; micOn: boolean }) => {
        setRemoteMicStates(prev => ({ ...prev, [userID]: micOn }));
      }
    );

    socket.on(
      StreamServiceMsg.SPEAKER_STATE,
      ({ userID, speakersOn }: { userID: string; speakersOn: boolean }) => {
        setRemoteSpeakerStates(prev => ({ ...prev, [userID]: speakersOn }));
      }
    );

    socket.on(
      StreamServiceMsg.SIGNAL,
      ({ userID, signal }: { userID: string; signal: unknown }) => {
        if (hasRequestedPermissions) {
          handleSignal(signal, userID, streamRef, peersRef, setRemoteStreams, pendingSignalsRef);
        }
      }
    );

    socket.on(StreamServiceMsg.CAMERA_OFF, (userID: string) => {
      if (userID !== storage.getUserId()) {
        setRemoteStreams(prev => {
          const newStreams = { ...prev };
          delete newStreams[userID];
          return newStreams;
        });
      }
    });

    return () => {
      socket.off(StreamServiceMsg.STREAM_READY);
      socket.off(StreamServiceMsg.USER_READY);
      socket.off(StreamServiceMsg.SIGNAL);
      socket.off(StreamServiceMsg.USER_DISCONNECTED);
      socket.off(StreamServiceMsg.MIC_STATE);
      socket.off(StreamServiceMsg.SPEAKER_STATE);
      socket.off(StreamServiceMsg.CAMERA_OFF);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRequestedPermissions, speakerOn]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      Object.keys(peersRef.current).forEach(userID => {
        cleanupPeer(userID, peersRef, setRemoteStreams);
      });
      socket.emit(StreamServiceMsg.CAMERA_OFF);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
