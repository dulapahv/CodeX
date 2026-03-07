/**
 * Webcam streaming component that enables video/audio communication.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useState } from 'react';

import { Mic, MicOff, RefreshCw, Video, VideoOff, Volume2, VolumeOff } from 'lucide-react';
import { isMobile } from 'react-device-detect';

import type { User } from '@codex/types/user';

import { Button } from '@/components/ui/button';

import { DeviceControls } from './components/device-controls';
import { VideoGrid } from './components/video-grid';
import { useMediaDevices } from './hooks/useMediaDevices';
import { usePeerConnections } from './hooks/usePeerConnections';
import { useSocketEvents } from './hooks/useSocketEvents';
import { useWebcamStream } from './hooks/useWebcamStream';

interface WebcamStreamProps {
  users: User[];
}

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const [micOn, setMicOn] = useState(false);

  // Custom hooks for state management
  const {
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
  } = useMediaDevices();

  const {
    remoteStreams,
    remoteMicStates,
    remoteSpeakerStates,
    peersRef,
    pendingSignalsRef,
    setRemoteStreams,
    setRemoteMicStates,
    setRemoteSpeakerStates
  } = usePeerConnections();

  const {
    cameraOn,
    speakerOn,
    videoRef,
    streamRef,
    handleToggleCamera,
    handleToggleMic,
    handleToggleSpeaker,
    handleRotateCamera,
    handleVideoDeviceSwitch,
    handleAudioDeviceSwitch
  } = useWebcamStream({
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    micOn,
    setMicOn
  });

  // Socket events management
  useSocketEvents({
    hasRequestedPermissions,
    speakerOn,
    streamRef,
    peersRef,
    pendingSignalsRef,
    setRemoteStreams,
    setRemoteMicStates,
    setRemoteSpeakerStates
  });

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)] p-2">
      <VideoGrid
        users={users}
        cameraOn={cameraOn}
        micOn={micOn}
        speakerOn={speakerOn}
        videoRef={videoRef}
        remoteStreams={remoteStreams}
        remoteMicStates={remoteMicStates}
        remoteSpeakerStates={remoteSpeakerStates}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <div className="flex items-center gap-2">
          <DeviceControls
            icon={cameraOn ? Video : VideoOff}
            label="camera"
            devices={videoDevices}
            selectedDevice={selectedVideoDevice}
            onDeviceSelect={deviceId =>
              handleVideoDeviceSwitch(
                deviceId,
                peersRef,
                setRemoteStreams,
                pendingSignalsRef,
                setSelectedVideoDevice
              )
            }
            onToggle={() => handleToggleCamera(peersRef, setRemoteStreams, pendingSignalsRef)}
            isEnabled={cameraOn}
            onDevicePermissionGranted={handleDevicePermission}
          />

          {isMobile && cameraOn && (
            <Button
              onClick={() => handleRotateCamera(peersRef, setRemoteStreams, pendingSignalsRef)}
              variant="ghost"
              size="icon"
              className="bg-foreground/10 hover:bg-foreground/20"
              aria-label="Rotate camera"
            >
              <RefreshCw className="size-5" />
            </Button>
          )}
        </div>

        <DeviceControls
          icon={micOn ? Mic : MicOff}
          label="microphone"
          devices={audioInputDevices}
          selectedDevice={selectedAudioInput}
          onDeviceSelect={deviceId =>
            handleAudioDeviceSwitch(
              deviceId,
              peersRef,
              setRemoteStreams,
              pendingSignalsRef,
              setSelectedAudioInput
            )
          }
          onToggle={handleToggleMic}
          isEnabled={micOn}
          disableToggle={!cameraOn}
          onDevicePermissionGranted={handleDevicePermission}
        />

        <DeviceControls
          icon={speakerOn ? Volume2 : VolumeOff}
          label="speaker"
          devices={audioOutputDevices}
          selectedDevice={selectedAudioOutput}
          onDeviceSelect={deviceId => handleAudioOutputSelect(deviceId, videoRef)}
          onToggle={() => handleToggleSpeaker(!speakerOn)}
          isEnabled={speakerOn}
          onDevicePermissionGranted={handleDevicePermission}
        />
      </div>
    </div>
  );
};

export { WebcamStream };
