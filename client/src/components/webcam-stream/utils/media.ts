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

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    // Store the stream
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      // Set audio output if supported
      if ('setSinkId' in videoRef.current && selectedAudioOutput) {
        try {
          await (videoRef.current as any).setSinkId(selectedAudioOutput);
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
        streamRef.current?.getTracks().forEach((track) => {
          try {
            peer.addTrack(track, streamRef.current!);
          } catch (error) {
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
        });
      }
    });

    return true;
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};
