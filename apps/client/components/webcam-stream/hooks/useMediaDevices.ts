/**
 * Custom hook for managing media devices (camera, microphone, speaker).
 * Handles device enumeration, selection, and permission management.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import type { MediaDevice } from "../types";
import {
  enumerateDevices,
  handleDevicePermissionGranted,
  initDevices,
} from "../utils/device";

export const useMediaDevices = () => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    []
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  // Initialize device enumeration (no getUserMedia - avoids camera flash)
  useEffect(() => {
    const handleDeviceChange = async () => {
      await enumerateDevices(
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices,
        selectedVideoDevice,
        setSelectedVideoDevice,
        selectedAudioInput,
        setSelectedAudioInput,
        selectedAudioOutput,
        setSelectedAudioOutput
      );
    };

    initDevices(handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  const handleDevicePermission = useCallback(
    async (kind: "videoinput" | "audioinput" | "audiooutput") => {
      await handleDevicePermissionGranted(
        kind,
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices
      );
    },
    []
  );

  return {
    videoDevices,
    audioInputDevices,
    audioOutputDevices,
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    setSelectedVideoDevice,
    setSelectedAudioInput,
    setSelectedAudioOutput,
    handleDevicePermission,
  };
};
