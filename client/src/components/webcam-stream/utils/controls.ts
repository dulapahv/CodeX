import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { isMobile } from 'react-device-detect';
import { toast } from 'sonner';

import { StreamServiceMsg } from '@common/types/message';

import { getSocket } from '@/lib/socket';
import { parseError } from '@/lib/utils';

// Toggle camera
export const toggleCamera = async (
  cameraOn: boolean,
  setCameraOn: Dispatch<SetStateAction<boolean>>,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: MutableRefObject<MediaStream | null>,
  videoRef: MutableRefObject<HTMLVideoElement | null>,
  getMedia: () => Promise<boolean>,
) => {
  const socket = getSocket();

  try {
    if (!cameraOn) {
      // Request both permissions at once instead of separately
      try {
        const permissions = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // Stop the temporary stream immediately
        permissions.getTracks().forEach((track) => track.stop());

        // Get the actual media stream with selected devices
        const mediaStarted = await getMedia();
        if (mediaStarted) {
          setCameraOn(true);
        }
      } catch (error) {
        // Handle permission denial
        toast.error(
          'Please allow camera and microphone access to use this feature.',
        );
        return;
      }
    } else {
      // Turning off camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      socket.emit(StreamServiceMsg.CAMERA_OFF);
      streamRef.current = null;
      setCameraOn(false);
      setMicOn(false);
    }
  } catch (error) {
    toast.error(`Error toggling camera: ${parseError(error)}`);
  }
};

// Rotate camera
export const rotateCamera = async (
  cameraOn: boolean,
  cameraFacingMode: string,
  setCameraFacingMode: Dispatch<SetStateAction<'user' | 'environment'>>,
  streamRef: MutableRefObject<MediaStream | null>,
  getMedia: () => Promise<boolean>,
) => {
  if (!isMobile) return;

  const newFacingMode = cameraFacingMode === 'user' ? 'environment' : 'user';
  setCameraFacingMode(newFacingMode);

  if (cameraOn) {
    // Stop current stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    // Get new stream with rotated camera
    await getMedia();
  }
};

// Toggle microphone
export const toggleMic = (
  micOn: boolean,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: MutableRefObject<MediaStream | null>,
) => {
  const socket = getSocket();

  try {
    if (!streamRef.current) {
      toast.error('No active media stream');
      return;
    }

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      toast.error('No audio track found');
      return;
    }

    const newMicState = !micOn;
    audioTracks.forEach((track) => {
      track.enabled = newMicState;
    });

    setMicOn(newMicState);
    socket.emit(StreamServiceMsg.MIC_STATE, newMicState);
  } catch (error) {
    toast.error(`Error toggling microphone.\n${parseError(error)}`);
  }
};

export const toggleSpeaker = (
  speakerOn: boolean,
  setSpeakersOn: Dispatch<SetStateAction<boolean>>,
) => {
  const socket = getSocket();
  const newSpeakerState = !speakerOn;

  // Update local state
  setSpeakersOn(newSpeakerState);

  // Emit to other users with a small delay to ensure state is updated
  setTimeout(() => {
    socket.emit(StreamServiceMsg.SPEAKER_STATE, newSpeakerState);
  }, 0);
};
