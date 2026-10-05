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

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";
import { reportWebcamError } from "./errors";

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

// Detach the local stream from every peer and release the devices
const stopMedia = (
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>
) => {
  if (streamRef.current) {
    removeTracksFromPeers(streamRef.current, peersRef);
  }
  stopLocalStream(streamRef, videoRef);
};

// Toggle camera on/off
export const toggleCamera = async (
  cameraOn: boolean,
  setCameraOn: Dispatch<SetStateAction<boolean>>,
  micOn: boolean,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  getMedia: (withVideo: boolean) => Promise<boolean>
) => {
  const socket = getSocket();

  try {
    if (!cameraOn) {
      if (await getMedia(true)) {
        setCameraOn(true);
      }
      return;
    }

    socket.emit(StreamServiceMsg.CAMERA_OFF);
    setCameraOn(false);

    // Keep the call going on an audio-only stream
    if (micOn && (await getMedia(false))) {
      return;
    }

    stopMedia(streamRef, videoRef, peersRef);
    if (micOn) {
      setMicOn(false);
      socket.emit(StreamServiceMsg.MIC_STATE, false);
    }
  } catch (error) {
    reportWebcamError(`Error toggling camera: ${parseError(error)}`);
  }
};

// Rotate camera (mobile only)
export const rotateCamera = async (
  cameraOn: boolean,
  cameraFacingMode: string,
  setCameraFacingMode: Dispatch<SetStateAction<"user" | "environment">>,
  streamRef: RefObject<MediaStream | null>,
  getMedia: (facingMode: "user" | "environment") => Promise<boolean>
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
    await getMedia(newFacingMode);
  }
};

// Toggle microphone. With the camera off the mic gets its own audio-only stream.
export const toggleMic = async (
  micOn: boolean,
  setMicOn: Dispatch<SetStateAction<boolean>>,
  cameraOn: boolean,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  startAudioOnly: () => Promise<boolean>
) => {
  const socket = getSocket();
  const newMicState = !micOn;

  try {
    if (cameraOn) {
      const audioTracks = streamRef.current?.getAudioTracks() ?? [];
      if (audioTracks.length === 0) {
        reportWebcamError("No audio track found");
        return;
      }
      for (const track of audioTracks) {
        track.enabled = newMicState;
      }
    } else if (newMicState) {
      if (!(await startAudioOnly())) {
        return;
      }
    } else {
      stopMedia(streamRef, videoRef, peersRef);
      socket.emit(StreamServiceMsg.CAMERA_OFF);
    }

    setMicOn(newMicState);
    socket.emit(StreamServiceMsg.MIC_STATE, newMicState);
  } catch (error) {
    reportWebcamError(`Error toggling microphone.\n${parseError(error)}`);
  }
};
