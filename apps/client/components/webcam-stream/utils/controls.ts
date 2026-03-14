/**
 * Device stream control functions for webcam interface.
 * Features:
 * - Camera toggle with peer track cleanup
 * - Camera rotation (mobile)
 * - Microphone toggle
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { isMobile } from "react-device-detect";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

// Remove all tracks from peer connections before stopping them
const removeTracksFromPeers = (
  stream: MediaStream,
  peersRef: RefObject<Record<string, Peer.Instance>>
) => {
  const tracks = stream.getTracks();
  for (const peer of Object.values(peersRef.current)) {
    if (peer.destroyed) {
      continue;
    }
    for (const track of tracks) {
      try {
        peer.removeTrack(track, stream);
      } catch {
        // Track may not be on this peer, that's OK
      }
    }
  }
};

// Stop all tracks and clean up the local stream
const stopLocalStream = (
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>
) => {
  if (streamRef.current) {
    for (const track of streamRef.current.getTracks()) {
      track.stop();
    }
  }
  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }
  streamRef.current = null;
};

// Toggle camera on/off
export const toggleCamera = async (
  cameraOn: boolean,
  setCameraOn: Dispatch<SetStateAction<boolean>>,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  getMedia: () => Promise<boolean>
) => {
  const socket = getSocket();

  try {
    if (cameraOn) {
      // Turning off - remove tracks from peers, stop stream, notify others
      if (streamRef.current) {
        removeTracksFromPeers(streamRef.current, peersRef);
      }
      stopLocalStream(streamRef, videoRef);
      socket.emit(StreamServiceMsg.CAMERA_OFF);
      setCameraOn(false);
      setMicOn(false);
    } else {
      // Turning on - get media stream and set up peer tracks
      const mediaStarted = await getMedia();
      if (mediaStarted) {
        setCameraOn(true);
      }
    }
  } catch (error) {
    toast.error(`Error toggling camera: ${parseError(error)}`);
  }
};

// Rotate camera (mobile only)
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
