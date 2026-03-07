/**
 * Custom hook for managing media devices (camera, microphone, speaker).
 * Handles device enumeration, selection, and permission management.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useCallback, useEffect, useState } from 'react';

import { toast } from 'sonner';

import { parseError } from '@/lib/utils';

import type { MediaDevice } from '../types';
import { enumerateDevices, handleDevicePermissionGranted, initDevices } from '../utils/device';

export const useMediaDevices = () => {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDevice[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [hasRequestedPermissions, setHasRequestedPermissions] = useState(false);

  // Initialize device enumeration
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
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [selectedVideoDevice, selectedAudioInput, selectedAudioOutput]);

  // Request permissions on mount
  useEffect(() => {
    const requestInitialPermissions = async () => {
      if (hasRequestedPermissions) return;

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasLabels = devices.some(device => device.label !== '');

        if (!hasLabels) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: true
          });
          stream.getTracks().forEach(track => track.stop());
        }

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

        setHasRequestedPermissions(true);
      } catch (error) {
        console.warn('Initial permission request failed:', error);
      }
    };

    requestInitialPermissions();
  }, [hasRequestedPermissions, selectedAudioInput, selectedAudioOutput, selectedVideoDevice]);

  const handleDevicePermission = useCallback(
    async (kind: 'videoinput' | 'audioinput' | 'audiooutput') => {
      await handleDevicePermissionGranted(
        kind,
        setVideoDevices,
        setAudioInputDevices,
        setAudioOutputDevices
      );
    },
    []
  );

  const handleAudioOutputSelect = useCallback(
    async (deviceId: string, videoRef: React.RefObject<HTMLVideoElement | null>) => {
      setSelectedAudioOutput(deviceId);
      if (videoRef.current && 'setSinkId' in videoRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (videoRef.current as any).setSinkId(deviceId);
        } catch (error) {
          toast.error(`Error setting audio output: ${parseError(error)}`);
        }
      }
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
    hasRequestedPermissions,
    setSelectedVideoDevice,
    setSelectedAudioInput,
    handleDevicePermission,
    handleAudioOutputSelect
  };
};
