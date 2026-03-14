/**
 * Custom hook for managing local webcam stream state and controls.
 * Handles camera/mic toggling and facial mode switching.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { StreamServiceMsg } from "@codex/types/message";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import type Peer from "simple-peer";
import { toast } from "sonner";

import { getSocket } from "@/lib/socket";
import { parseError } from "@/lib/utils";

import { rotateCamera, toggleCamera, toggleMic } from "../utils/controls";
import { getMedia } from "../utils/media";

interface UseWebcamStreamProps {
  micOn: boolean;
  selectedAudioInput: string;
  selectedAudioOutput: string;
  selectedVideoDevice: string;
  setMicOn: Dispatch<SetStateAction<boolean>>;
}

export const useWebcamStream = ({
  selectedVideoDevice,
  selectedAudioInput,
  selectedAudioOutput,
  micOn,
  setMicOn,
}: UseWebcamStreamProps) => {
  const socket = getSocket();
  const [cameraOn, setCameraOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleGetMedia = useCallback(
    (
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>
    ) => {
      return getMedia(
        selectedVideoDevice,
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
    },
    [
      selectedVideoDevice,
      selectedAudioInput,
      selectedAudioOutput,
      cameraFacingMode,
      micOn,
    ]
  );

  const handleToggleCamera = useCallback(
    async (
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>
    ) => {
      await toggleCamera(
        cameraOn,
        setCameraOn,
        setMicOn,
        streamRef,
        videoRef,
        peersRef,
        () => handleGetMedia(peersRef, setRemoteStreams, pendingSignalsRef)
      );
    },
    [cameraOn, handleGetMedia, setMicOn]
  );

  const handleToggleMic = useCallback(() => {
    toggleMic(micOn, setMicOn, streamRef);
  }, [micOn, setMicOn]);

  const handleToggleSpeaker = useCallback(
    (newState: boolean) => {
      setSpeakerOn(newState);
      socket.emit(StreamServiceMsg.SPEAKER_STATE, newState);

      // Find all video elements in the component and update their muted state
      const videoElements = document.querySelectorAll("video");
      for (const video of videoElements) {
        if (video !== videoRef.current) {
          // Don't mute local video
          video.muted = !newState;
        }
      }
    },
    [socket]
  );

  const handleRotateCamera = useCallback(
    async (
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>
    ) => {
      await rotateCamera(
        cameraOn,
        cameraFacingMode,
        setCameraFacingMode,
        streamRef,
        () => handleGetMedia(peersRef, setRemoteStreams, pendingSignalsRef)
      );
    },
    [cameraOn, cameraFacingMode, handleGetMedia]
  );

  const handleVideoDeviceSwitch = useCallback(
    async (
      deviceId: string,
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>,
      setSelectedVideoDevice: (value: string) => void
    ) => {
      // Always store the preference
      setSelectedVideoDevice(deviceId);

      // Only activate the device if camera is currently on
      if (!cameraOn) {
        return;
      }

      try {
        const { switchVideoDevice } = await import("../utils/media");
        await switchVideoDevice(
          deviceId,
          streamRef,
          videoRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef,
          micOn,
          selectedAudioInput,
          selectedAudioOutput,
          cameraFacingMode
        );
      } catch (error) {
        toast.error(`Failed to switch video device: ${parseError(error)}`);
      }
    },
    [cameraOn, micOn, selectedAudioInput, selectedAudioOutput, cameraFacingMode]
  );

  const handleAudioDeviceSwitch = useCallback(
    async (
      deviceId: string,
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>,
      setSelectedAudioInput: (value: string) => void
    ) => {
      // Always store the preference
      setSelectedAudioInput(deviceId);

      // Only activate the device if camera is currently on
      if (!cameraOn) {
        return;
      }

      try {
        const { switchAudioDevice } = await import("../utils/media");
        await switchAudioDevice(
          deviceId,
          streamRef,
          videoRef,
          peersRef,
          setRemoteStreams,
          pendingSignalsRef,
          micOn,
          selectedVideoDevice,
          selectedAudioOutput,
          cameraFacingMode
        );
      } catch (error) {
        toast.error(`Failed to switch audio device: ${parseError(error)}`);
      }
    },
    [
      cameraOn,
      micOn,
      selectedVideoDevice,
      selectedAudioOutput,
      cameraFacingMode,
    ]
  );

  return {
    cameraOn,
    speakerOn,
    cameraFacingMode,
    videoRef,
    streamRef,
    handleGetMedia,
    handleToggleCamera,
    handleToggleMic,
    handleToggleSpeaker,
    handleRotateCamera,
    handleVideoDeviceSwitch,
    handleAudioDeviceSwitch,
  };
};
