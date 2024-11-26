import { Dispatch, MutableRefObject, RefObject, SetStateAction } from 'react';
import { isMobile } from 'react-device-detect';
import type Peer from 'simple-peer';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

import { cleanupPeer, createPeer } from './peer';

// Get local media stream
export const getMedia = async (
  selectedVideoDevice: string,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: 'user' | 'environment',
  micOn: boolean,
  streamRef: MutableRefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement>,
  peersRef: MutableRefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: MutableRefObject<Record<string, any[]>>,
) => {
  try {
    // Stop any existing tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Build constraints based on selected devices
    const constraints: MediaStreamConstraints = {
      video: isMobile
        ? { facingMode: cameraFacingMode }
        : selectedVideoDevice
          ? { deviceId: { exact: selectedVideoDevice } }
          : true,
      audio: selectedAudioInput
        ? { deviceId: { exact: selectedAudioInput } }
        : true,
    };

    // Try to get the stream with exact constraints first
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      handleStreamSuccess(
        stream,
        streamRef,
        videoRef,
        selectedAudioOutput,
        micOn,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
      );
      return true;
    } catch (exactError) {
      console.warn(
        'Failed to get stream with exact constraints, trying fallback:',
        exactError,
      );

      // Fallback to basic constraints
      const fallbackStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      handleStreamSuccess(
        fallbackStream,
        streamRef,
        videoRef,
        selectedAudioOutput,
        micOn,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef,
      );
      return true;
    }
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};

// Helper function to handle successful stream acquisition
const handleStreamSuccess = (
  stream: MediaStream,
  streamRef: MutableRefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement>,
  selectedAudioOutput: string,
  micOn: boolean,
  peersRef: MutableRefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: MutableRefObject<Record<string, any[]>>,
) => {
  // Store the stream
  streamRef.current = stream;
  if (videoRef.current) {
    videoRef.current.srcObject = stream;
    // Set audio output if supported
    if ('setSinkId' in videoRef.current && selectedAudioOutput) {
      try {
        (videoRef.current as any).setSinkId(selectedAudioOutput);
      } catch (error) {
        console.warn('Error setting audio output device:', error);
      }
    }
  }

  // Set initial audio track state
  stream.getAudioTracks().forEach((track) => {
    track.enabled = micOn;
  });

  // Update existing peer connections
  Object.entries(peersRef.current).forEach(([userID, peer]) => {
    if (!peer.destroyed) {
      try {
        // Properly remove old tracks
        const oldStream = peer.streams[0];
        if (oldStream) {
          oldStream.getTracks().forEach((track) => {
            track.stop();
            peer.removeTrack(track, oldStream);
          });
        }

        // Add new tracks
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });
      } catch (error) {
        console.warn('Error updating peer tracks:', error);
        // If updating tracks fails, recreate the peer
        cleanupPeer(userID, peersRef, setRemoteStreams);
        createPeer(
          userID,
          true,
          streamRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef,
        );
      }
    }
  });
};
