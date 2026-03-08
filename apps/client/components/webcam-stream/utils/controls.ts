/**
 * Device stream control functions for webcam interface.
 * Features:
 * - Camera toggle control
 * - Permission handling
 * - Stream initialization
 * - Error handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { isMobile } from "react-device-detect";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

// Toggle camera
export const toggleCamera = async (
  cameraOn: boolean,
  setCameraOn: Dispatch<SetStateAction<boolean>>,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  getMedia: () => Promise<boolean>
) => {
  const socket = getSocket();

  try {
    if (cameraOn) {
      // Turning off camera
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      socket.emit(StreamServiceMsg.CAMERA_OFF);
      streamRef.current = null;
      setCameraOn(false);
      setMicOn(false);
    } else {
      // Get the media stream directly with selected devices
      // No need for separate permission check since we already did it on mount
      const mediaStarted = await getMedia();
      if (mediaStarted) {
        setCameraOn(true);
      }
    }
  } catch (error) {
    toast.error(`Error toggling camera: ${parseError(error)}`);
  }
};

// Rotate camera
export const rotateCamera = async (
  cameraOn: boolean,
  cameraFacingMode: string,
  setCameraFacingMode: Dispatch<SetStateAction<"user" | "environment">>,
  streamRef: RefObject<MediaStream | null>,
  getMedia: () => Promise<boolean>
) => {
  if (!isMobile) {
    return;
  }

  const newFacingMode = cameraFacingMode === "user" ? "environment" : "user";
  setCameraFacingMode(newFacingMode);

  if (cameraOn) {
    // Stop current stream
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }
    // Get new stream with rotated camera
    await getMedia();
  }
};

// Toggle microphone
export const toggleMic = (
  micOn: boolean,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: RefObject<MediaStream | null>
) => {
  const socket = getSocket();

  try {
    if (!streamRef.current) {
      toast.error("No active media stream");
      return;
    }

    const audioTracks = streamRef.current.getAudioTracks();
    if (audioTracks.length === 0) {
      toast.error("No audio track found");
      return;
    }

    const newMicState = !micOn;
    for (const track of audioTracks) {
      track.enabled = newMicState;
    }

    setMicOn(newMicState);
    socket.emit(StreamServiceMsg.MIC_STATE, newMicState);
  } catch (error) {
    toast.error(`Error toggling microphone.\n${parseError(error)}`);
  }
};
