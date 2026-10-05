/**
 * Custom hook for managing local webcam stream state and controls.
 * Handles camera/mic toggling and facial mode switching.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import type Peer from "simple-peer";

import { parseError } from "@/lib/utils";

import { rotateCamera, toggleCamera, toggleMic } from "../utils/controls";
import { reportWebcamError } from "../utils/errors";
import { getMedia, switchAudioDevice, switchVideoDevice } from "../utils/media";

interface MediaRequest {
  facingMode?: "user" | "environment";
  micEnabled: boolean;
  withVideo: boolean;
}

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
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>,
      { facingMode = cameraFacingMode, micEnabled, withVideo }: MediaRequest
    ) => {
      return getMedia(
        selectedVideoDevice,
        selectedAudioInput,
        selectedAudioOutput,
        facingMode,
        withVideo,
        micEnabled,
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
        micOn,
        setMicOn,
        streamRef,
        videoRef,
        peersRef,
        (withVideo) =>
          handleGetMedia(peersRef, setRemoteStreams, pendingSignalsRef, {
            micEnabled: micOn,
            withVideo,
          })
      );
    },
    [cameraOn, micOn, handleGetMedia, setMicOn]
  );

  const handleToggleMic = useCallback(
    async (
      peersRef: React.RefObject<Record<string, Peer.Instance>>,
      setRemoteStreams: React.Dispatch<
        React.SetStateAction<Record<string, MediaStream | null>>
      >,
      pendingSignalsRef: React.RefObject<Record<string, Peer.SignalData[]>>
    ) => {
      await toggleMic(
        micOn,
        setMicOn,
        cameraOn,
        streamRef,
        videoRef,
        peersRef,
        () =>
          handleGetMedia(peersRef, setRemoteStreams, pendingSignalsRef, {
            micEnabled: true,
            withVideo: false,
          })
      );
    },
    [cameraOn, micOn, handleGetMedia, setMicOn]
  );

  const handleToggleSpeaker = setSpeakerOn;

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
        (facingMode) =>
          handleGetMedia(peersRef, setRemoteStreams, pendingSignalsRef, {
            facingMode,
            micEnabled: micOn,
            withVideo: true,
          })
      );
    },
    [cameraOn, cameraFacingMode, micOn, handleGetMedia]
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
        reportWebcamError(
          `Failed to switch video device: ${parseError(error)}`
        );
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

      // Only activate the device while a stream is live
      if (!(cameraOn || micOn)) {
        return;
      }

      try {
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
          cameraFacingMode,
          cameraOn
        );
      } catch (error) {
        reportWebcamError(
          `Failed to switch audio device: ${parseError(error)}`
        );
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
