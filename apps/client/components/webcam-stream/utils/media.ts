/**
 * Media stream utilities for webcam interface.
 * Features:
 * - Stream initialization with device selection
 * - Peer connection recreation on stream change
 * - Device switching
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, RefObject, SetStateAction } from "react";

import { isMobile } from "react-device-detect";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { parseError } from "@/lib/utils";

import { cleanupPeer, createPeer } from "./peer";

// Get local media stream and recreate peer connections with the new stream
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
) => {
  try {
    // Stop any existing tracks before requesting new ones
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
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

    // Get new stream
    const newStream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: audioConstraints,
    });

    // Set audio track state based on mic status
    for (const track of newStream.getAudioTracks()) {
      track.enabled = micOn;
    }

    // Update stream reference before peer recreation
    streamRef.current = newStream;

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

    // Recreate all peer connections with the new stream.
    // This is more reliable than trying to add/remove individual tracks,
    // which can leave stale tracks and cause negotiation issues.
    const peerUserIDs = Object.keys(peersRef.current);
    for (const userID of peerUserIDs) {
      cleanupPeer(userID, peersRef, setRemoteStreams);
      createPeer(
        userID,
        true,
        streamRef,
        peersRef,
        setRemoteStreams,
        pendingSignalsRef
      );
    }

    return true;
  } catch (error) {
    toast.error(`Error accessing media devices: ${parseError(error)}`);
    return false;
  }
};

// Switch video device (calls getMedia with the new device)
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

// Switch audio input device (calls getMedia with the new device)
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
