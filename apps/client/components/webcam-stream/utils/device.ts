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

import type { Dispatch, SetStateAction } from 'react';

import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

import type { MediaDevice } from '../types';

export const initDevices = async (handleDeviceChange: () => Promise<void>) => {
  // Only enumerate devices without requesting permissions
  await handleDeviceChange();

  // Listen for device changes
  navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
};

export const enumerateDevices = async (
  setVideoDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioInputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioOutputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  selectedVideoDevice: string,
  setSelectedVideoDevice: Dispatch<SetStateAction<string>>,
  selectedAudioInput: string,
  setSelectedAudioInput: Dispatch<SetStateAction<string>>,
  selectedAudioOutput: string,
  setSelectedAudioOutput: Dispatch<SetStateAction<string>>,
) => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Group devices by kind and ensure they have valid deviceIds
    const videoInputs = devices.filter(
      (device) => device.kind === 'videoinput' && device.deviceId !== '',
    );
    const audioInputs = devices.filter(
      (device) => device.kind === 'audioinput' && device.deviceId !== '',
    );
    const audioOutputs = devices.filter(
      (device) => device.kind === 'audiooutput' && device.deviceId !== '',
    );

    // Function to get a generic label if permissions haven't been granted
    const getDeviceLabel = (
      device: MediaDeviceInfo,
      type: string,
      index: number,
    ) => {
      return device.label || `${type} ${index + 1}`;
    };

    // Set all available devices
    setVideoDevices(
      videoInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: getDeviceLabel(device, 'Camera', index),
      })),
    );
    setAudioInputDevices(
      audioInputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: getDeviceLabel(device, 'Microphone', index),
      })),
    );
    setAudioOutputDevices(
      audioOutputs.map((device, index) => ({
        deviceId: device.deviceId,
        label: getDeviceLabel(device, 'Speaker', index),
      })),
    );

    // Set default devices if not already set
    if (!selectedVideoDevice && videoInputs.length > 0) {
      const defaultVideo = videoInputs[0]?.deviceId;
      if (defaultVideo) setSelectedVideoDevice(defaultVideo);
    }

    if (!selectedAudioInput && audioInputs.length > 0) {
      const defaultAudio = audioInputs[0]?.deviceId;
      if (defaultAudio) setSelectedAudioInput(defaultAudio);
    }

    if (!selectedAudioOutput && audioOutputs.length > 0) {
      const defaultOutput = audioOutputs[0]?.deviceId;
      if (defaultOutput) setSelectedAudioOutput(defaultOutput);
    }
  } catch (error) {
    toast.error(`Error enumerating devices: ${parseError(error)}`);
  }
};

// Helper function to update device lists after permissions are granted
export const updateDeviceLabels = async (
  setVideoDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioInputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioOutputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
) => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  const videoInputs = devices.filter((device) => device.kind === 'videoinput');
  const audioInputs = devices.filter((device) => device.kind === 'audioinput');
  const audioOutputs = devices.filter(
    (device) => device.kind === 'audiooutput',
  );

  setVideoDevices(
    videoInputs.map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
    })),
  );
  setAudioInputDevices(
    audioInputs.map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
    })),
  );
  setAudioOutputDevices(
    audioOutputs.map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Speaker ${device.deviceId.slice(0, 4)}`,
    })),
  );
};

export const handleDevicePermissionGranted = async (
  deviceKind: 'videoinput' | 'audioinput' | 'audiooutput',
  setVideoDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioInputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
  setAudioOutputDevices: Dispatch<SetStateAction<MediaDevice[]>>,
) => {
  const devices = await navigator.mediaDevices.enumerateDevices();

  // Update only the relevant device list
  switch (deviceKind) {
    case 'videoinput':
      setVideoDevices(
        devices
          .filter((device) => device.kind === 'videoinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${device.deviceId.slice(0, 4)}`,
          })),
      );
      break;
    case 'audioinput':
      setAudioInputDevices(
        devices
          .filter((device) => device.kind === 'audioinput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Microphone ${device.deviceId.slice(0, 4)}`,
          })),
      );
      break;
    case 'audiooutput':
      setAudioOutputDevices(
        devices
          .filter((device) => device.kind === 'audiooutput')
          .map((device) => ({
            deviceId: device.deviceId,
            label: device.label || `Speaker ${device.deviceId.slice(0, 4)}`,
          })),
      );
      break;
  }
};
