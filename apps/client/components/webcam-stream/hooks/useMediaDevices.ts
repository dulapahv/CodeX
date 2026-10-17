/**
 * Custom hook for listing media devices (camera, microphone, speaker).
 * The active camera and microphone are chosen by the call; this only keeps
 * the lists current.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from "react";

import { parseError } from "@/lib/utils";

import { type DeviceLists, listDevices } from "../utils/device";
import { reportWebcamError } from "../utils/errors";

const NO_DEVICES: DeviceLists = {
  audioInputDevices: [],
  audioOutputDevices: [],
  videoDevices: [],
};

export const useMediaDevices = () => {
  const [devices, setDevices] = useState<DeviceLists>(NO_DEVICES);

  const refreshDevices = useCallback(async () => {
    try {
      setDevices(await listDevices());
    } catch (error) {
      reportWebcamError(`Error enumerating devices: ${parseError(error)}`);
    }
  }, []);

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

  return { ...devices, refreshDevices };
};
