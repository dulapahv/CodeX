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

import type { Dispatch, RefObject, SetStateAction } from "react";

import { isMobile } from "react-device-detect";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { parseError } from "@/lib/utils";

import { cleanupPeer, createPeer } from "./peer";

// Get local media stream with proper camera constraints
export const getMedia = async (
  selectedVideoDevice: string,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment",
  micOn: boolean,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: media handling requires many device/stream branches
) => {
  try {
    // Stop any existing tracks before requesting new ones
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      for (const track of tracks) {
        track.stop();
      }
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
    for (const track of newStream.getAudioTracks()) {
      track.enabled = micOn;
    }

    // Update video element
    if (videoRef.current) {
      videoRef.current.srcObject = newStream;
      // Set audio output if supported
      if ("setSinkId" in videoRef.current && selectedAudioOutput) {
        try {
          await (
            videoRef.current as unknown as {
              setSinkId: (id: string) => Promise<void>;
            }
          ).setSinkId(selectedAudioOutput);
        } catch (error) {
          console.warn("Error setting audio output device:", error);
        }
      }
    }

    // Update peer connections with new tracks
    for (const [userID, peer] of Object.entries(peersRef.current)) {
      if (!peer.destroyed) {
        try {
          // Remove old tracks
          if (streamRef.current) {
            for (const track of streamRef.current.getTracks()) {
              if (streamRef.current) {
                peer.removeTrack(track, streamRef.current);
              }
            }
          }

          // Add new tracks
          for (const track of newStream.getTracks()) {
            peer.addTrack(track, newStream);
          }
        } catch (error) {
          console.warn("Error updating peer tracks:", error);
          // If updating tracks fails, recreate the peer
          cleanupPeer(userID, peersRef, setRemoteStreams);
          createPeer(
            userID,
            true,
            { current: newStream },
            peersRef,
            setRemoteStreams,
            pendingSignalsRef
          );
        }
      }
    }

    // Update stream reference
    streamRef.current = newStream;
    return true;
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};

// Helper function to switch video device
export const switchVideoDevice = (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>,
  micOn: boolean,
  selectedAudioInput: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment"
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
    pendingSignalsRef
  );
};

// Helper function to switch audio input device
export const switchAudioDevice = (
  deviceId: string,
  streamRef: RefObject<MediaStream | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
  peersRef: RefObject<Record<string, Peer.Instance>>,
  setRemoteStreams: Dispatch<
    SetStateAction<Record<string, MediaStream | null>>
  >,
  pendingSignalsRef: RefObject<Record<string, Peer.SignalData[]>>,
  micOn: boolean,
  selectedVideoDevice: string,
  selectedAudioOutput: string,
  cameraFacingMode: "user" | "environment"
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
    pendingSignalsRef
  );
};
