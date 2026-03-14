/**
 * Webcam streaming component that enables video/audio communication.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { User } from "@codex/types/user";

import {
  Mic,
  MicOff,
  RefreshCw,
  Video,
  VideoOff,
  Volume2,
  VolumeOff,
} from "lucide-react";
import { useState } from "react";
import { isMobile } from "react-device-detect";

import { Button } from "@/components/ui/button";

import { DeviceControls } from "./components/device-controls";
import { VideoGrid } from "./components/video-grid";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { usePeerConnections } from "./hooks/usePeerConnections";
import { useSocketEvents } from "./hooks/useSocketEvents";
import { useWebcamStream } from "./hooks/useWebcamStream";

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
    setSelectedVideoDevice,
    setSelectedAudioInput,
    handleDevicePermission,
    handleAudioOutputSelect,
  } = useMediaDevices();

  const {
    remoteStreams,
    remoteMicStates,
    remoteSpeakerStates,
    peersRef,
    pendingSignalsRef,
    setRemoteStreams,
    setRemoteMicStates,
    setRemoteSpeakerStates,
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
    handleAudioDeviceSwitch,
  } = useWebcamStream({
    selectedVideoDevice,
    selectedAudioInput,
    selectedAudioOutput,
    micOn,
    setMicOn,
  });

  // Socket events management
  useSocketEvents({
    speakerOn,
    streamRef,
    peersRef,
    pendingSignalsRef,
    setRemoteStreams,
    setRemoteMicStates,
    setRemoteSpeakerStates,
  });

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)] p-2">
      <VideoGrid
        cameraOn={cameraOn}
        micOn={micOn}
        remoteMicStates={remoteMicStates}
        remoteSpeakerStates={remoteSpeakerStates}
        remoteStreams={remoteStreams}
        speakerOn={speakerOn}
        users={users}
        videoRef={videoRef}
      />

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <div className="flex items-center gap-2">
          <DeviceControls
            devices={videoDevices}
            icon={cameraOn ? Video : VideoOff}
            isEnabled={cameraOn}
            label="camera"
            onDevicePermissionGranted={handleDevicePermission}
            onDeviceSelect={(deviceId) =>
              handleVideoDeviceSwitch(
                deviceId,
                peersRef,
                setRemoteStreams,
                pendingSignalsRef,
                setSelectedVideoDevice
              )
            }
            onToggle={() =>
              handleToggleCamera(peersRef, setRemoteStreams, pendingSignalsRef)
            }
            selectedDevice={selectedVideoDevice}
          />

          {isMobile && cameraOn && (
            <Button
              aria-label="Rotate camera"
              className="bg-foreground/10 hover:bg-foreground/20"
              onClick={() =>
                handleRotateCamera(
                  peersRef,
                  setRemoteStreams,
                  pendingSignalsRef
                )
              }
              size="icon"
              variant="ghost"
            >
              <RefreshCw className="size-5" />
            </Button>
          )}
        </div>

        <DeviceControls
          devices={audioInputDevices}
          disableToggle={!cameraOn}
          icon={micOn ? Mic : MicOff}
          isEnabled={micOn}
          label="microphone"
          onDevicePermissionGranted={handleDevicePermission}
          onDeviceSelect={(deviceId) =>
            handleAudioDeviceSwitch(
              deviceId,
              peersRef,
              setRemoteStreams,
              pendingSignalsRef,
              setSelectedAudioInput
            )
          }
          onToggle={handleToggleMic}
          selectedDevice={selectedAudioInput}
        />

        <DeviceControls
          devices={audioOutputDevices}
          icon={speakerOn ? Volume2 : VolumeOff}
          isEnabled={speakerOn}
          label="speaker"
          onDevicePermissionGranted={handleDevicePermission}
          onDeviceSelect={(deviceId) =>
            handleAudioOutputSelect(deviceId, videoRef)
          }
          onToggle={() => handleToggleSpeaker(!speakerOn)}
          selectedDevice={selectedAudioOutput}
        />
      </div>
    </div>
  );
};

export { WebcamStream };
