/**
 * Media device enumeration for the device pickers.
 * Features:
 * - Device lists per kind
 * - Filtering of unlabelled and duplicate entries
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { MediaDevice } from "../types";

// Chrome's alias for the Windows communications device, which is always
// listed again under its own name
const COMMUNICATIONS_DEVICE_ID = "communications";

export interface DeviceLists {
  audioInputDevices: MediaDevice[];
  audioOutputDevices: MediaDevice[];
  videoDevices: MediaDevice[];
}

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

export const listDevices = async (): Promise<DeviceLists> => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    videoDevices: toMediaDevices(devices, "videoinput", "Camera"),
    audioInputDevices: toMediaDevices(devices, "audioinput", "Microphone"),
    audioOutputDevices: toMediaDevices(devices, "audiooutput", "Speaker"),
  };
};
