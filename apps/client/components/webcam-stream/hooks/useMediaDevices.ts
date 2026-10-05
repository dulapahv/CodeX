/**
 * Custom hook for managing media devices (camera, microphone, speaker).
 * Handles device enumeration, selection, and permission management.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import type { MediaDevice } from "../types";
import { enumerateDevices } from "../utils/device";

export const useMediaDevices = () => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>(
    []
  );
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>("");
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");

  const refreshDevices = useCallback(
    () =>
      enumerateDevices(
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices,
        setSelectedVideoDevice,
        setSelectedAudioInput,
        setSelectedAudioOutput
      ),
    []
  );

  // Enumerate only (no getUserMedia) so the camera light stays off
  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        refreshDevices
      );
    };
  }, [refreshDevices]);

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
    refreshDevices,
  };
};
