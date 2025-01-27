/**
 * Media stream control functions for webcam interface.
 * Features:
 * - Stream initialization with device selection
 * - Track cleanup and management
 * - Peer connection setup
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, RefObject, SetStateAction } from 'react';

import { isMobile } from 'react-device-detect';
import type Peer from 'simple-peer';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

import { cleanupPeer, createPeer } from './peer';

// Get local media stream with proper camera constraints
export const getMedia = async (
  selectedVideoDevice: string,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: 'user' | 'environment',
  micOn: boolean,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>,
) => {
  try {
    // Stop any existing tracks before requesting new ones
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        track.stop();
      });
    }

    // Build video constraints based on platform and selected device
    const videoConstraints: MediaTrackConstraints = isMobile
      ? {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        }
      : {
          deviceId: selectedVideoDevice
            ? { exact: selectedVideoDevice }
            : undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          aspectRatio: { ideal: 16 / 9 },
        };

    // Build audio constraints
    const audioConstraints: boolean | MediaTrackConstraints = selectedAudioInput
      ? { deviceId: { exact: selectedAudioInput } }
      : true;

    // Complete constraints object
    const constraints: MediaStreamConstraints = {
      video: videoConstraints,
      audio: audioConstraints,
    };

    // Get new stream
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);

    // Set audio track state based on mic status
    newStream.getAudioTracks().forEach((track) => {
      track.enabled = micOn;
    });

    // Update video element
    if (videoRef.current) {
      videoRef.current.srcObject = newStream;
      // Set audio output if supported
      if ('setSinkId' in videoRef.current && selectedAudioOutput) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (videoRef.current as any).setSinkId(selectedAudioOutput);
        } catch (error) {
          console.warn('Error setting audio output device:', error);
        }
      }
    }

    // Update peer connections with new tracks
    Object.entries(peersRef.current).forEach(([userID, peer]) => {
      if (!peer.destroyed) {
        try {
          // Remove old tracks
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              peer.removeTrack(track, streamRef.current!);
            });
          }

          // Add new tracks
          newStream.getTracks().forEach((track) => {
            peer.addTrack(track, newStream);
          });
        } catch (error) {
          console.warn('Error updating peer tracks:', error);
          // If updating tracks fails, recreate the peer
          cleanupPeer(userID, peersRef, setRemoteStreams);
          createPeer(
            userID,
            true,
            { current: newStream },
            peersRef,
            setRemoteStreams,
            pendingSignalsRef,
          );
        }
      }
    });

    // Update stream reference
    streamRef.current = newStream;
    return true;
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};

// Helper function to switch video device
export const switchVideoDevice = async (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>,
  micOn: boolean,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: 'user' | 'environment',
) => {
  return getMedia(
    deviceId,
    selectedAudioInput,
    selectedAudioOutput,
    cameraFacingMode,
    micOn,
    streamRef,
    videoRef,
    peersRef,
    setRemoteStreams,
    pendingSignalsRef,
  );
};

// Helper function to switch audio input device
export const switchAudioDevice = async (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, unknown[]>>,
  micOn: boolean,
  selectedVideoDevice: string,
  selectedAudioOutput: string,
  cameraFacingMode: 'user' | 'environment',
) => {
  return getMedia(
    selectedVideoDevice,
    deviceId,
    selectedAudioOutput,
    cameraFacingMode,
    micOn,
    streamRef,
    videoRef,
    peersRef,
    setRemoteStreams,
    pendingSignalsRef,
  );
};
