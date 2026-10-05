/**
 * Media device initialization and enumeration utilities.
 * Features:
 * - Device list management
 * - Device change handling
 * - Permission management
 * - Device selection state
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { Dispatch, SetStateAction } from "react";

import { parseError } from "@/lib/utils";

import type { MediaDevice } from "../types";
import { reportWebcamError } from "./errors";

const DEFAULT_DEVICE_ID = "default";
// Chrome's alias for the Windows communications device, which is always
// listed again under its own name
const COMMUNICATIONS_DEVICE_ID = "communications";

const toMediaDevices = (
  devices: MediaDeviceInfo[],
  kind: MediaDeviceKind,
  fallbackLabel: string
): MediaDevice[] =>
  devices
    .filter(
      (device) =>
        device.kind === kind &&
        device.deviceId !== "" &&
        device.deviceId !== COMMUNICATIONS_DEVICE_ID
    )
    .map((device, index) => ({
      deviceId: device.deviceId,
      label: device.label || `${fallbackLabel} ${index + 1}`,
    }));

// Keep the current choice while it is still plugged in, otherwise prefer the
// system default
const pickDevice = (devices: MediaDevice[]) => (current: string) => {
  if (devices.some((device) => device.deviceId === current)) {
    return current;
  }
  const fallback =
    devices.find((device) => device.deviceId === DEFAULT_DEVICE_ID) ??
    devices[0];
  return fallback?.deviceId ?? "";
};

export const enumerateDevices = async (
  setVideoDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioInputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioOutputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setSelectedVideoDevice: Dispatch<SetStateAction<string>>,
  setSelectedAudioInput: Dispatch<SetStateAction<string>>,
  setSelectedAudioOutput: Dispatch<SetStateAction<string>>
) => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoInputs = toMediaDevices(devices, "videoinput", "Camera");
    const audioInputs = toMediaDevices(devices, "audioinput", "Microphone");
    const audioOutputs = toMediaDevices(devices, "audiooutput", "Speaker");

    setVideoDevices(videoInputs);
    setAudioInputDevices(audioInputs);
    setAudioOutputDevices(audioOutputs);

    setSelectedVideoDevice(pickDevice(videoInputs));
    setSelectedAudioInput(pickDevice(audioInputs));
    setSelectedAudioOutput(pickDevice(audioOutputs));
  } catch (error) {
    reportWebcamError(`Error enumerating devices: ${parseError(error)}`);
  }
};
