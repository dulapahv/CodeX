import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

import type { MediaDevice } from '../types';

export const initDevices = async (handleDeviceChange: () => Promise<void>) => {
  // Request initial permissions to get device labels
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.getTracks().forEach((track) => track.stop());
    await handleDeviceChange();
  } catch (error) {
    console.warn('Error getting initial permissions:', error);
  }

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

    // Group devices by kind
    const videoInputs = devices.filter(
      (device) => device.kind === 'videoinput',
    );
    const audioInputs = devices.filter(
      (device) => device.kind === 'audioinput',
    );
    const audioOutputs = devices.filter(
      (device) => device.kind === 'audiooutput',
    );

    // Set all available devices
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

    // Set default devices if not already set
    if (!selectedVideoDevice) {
      const defaultVideo =
        videoInputs.find((d) => d.deviceId === 'default')?.deviceId ||
        videoInputs[0]?.deviceId;
      if (defaultVideo) setSelectedVideoDevice(defaultVideo);
    }

    if (!selectedAudioInput) {
      const defaultAudio =
        audioInputs.find((d) => d.deviceId === 'default')?.deviceId ||
        audioInputs[0]?.deviceId;
      if (defaultAudio) setSelectedAudioInput(defaultAudio);
    }

    if (!selectedAudioOutput) {
      const defaultOutput =
        audioOutputs.find((d) => d.deviceId === 'default')?.deviceId ||
        audioOutputs[0]?.deviceId;
      if (defaultOutput) setSelectedAudioOutput(defaultOutput);
    }
  } catch (error) {
    toast.error(`Error enumerating devices: ${parseError(error)}`);
  }
};
