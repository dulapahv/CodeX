/**
 * Webcam streaming component that enables video/audio communication.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { PresenceMedia } from "@codex/types/realtime";
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
import { useEffect, useState } from "react";
import { isMobile } from "react-device-detect";

import { Button } from "@/components/ui/button";
import { usePresenceSelector, useRoom } from "@/lib/realtime/room-context";

import { DeviceControls } from "./components/device-controls";
import { VideoGrid } from "./components/video-grid";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { usePeerConnections } from "./hooks/usePeerConnections";
import { useRoomEvents } from "./hooks/useRoomEvents";
import { useWebcamStream } from "./hooks/useWebcamStream";
import { clearWebcamError, useWebcamError } from "./utils/errors";

interface WebcamStreamProps {
  users: User[];
}

type MediaByUser = Record<string, PresenceMedia>;

const selectMedia = (
  states: Map<number, { media?: PresenceMedia }>
): MediaByUser => {
  const media: MediaByUser = {};
  for (const [clientId, state] of states) {
    if (state.media) {
      media[String(clientId)] = state.media;
    }
  }
  return media;
};

const isSameMedia = (previous: MediaByUser, next: MediaByUser) =>
  JSON.stringify(previous) === JSON.stringify(next);

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const room = useRoom();
  const [micOn, setMicOn] = useState(false);
  const error = useWebcamError();
  const media = usePresenceSelector(selectMedia, isSameMedia);

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
    setSelectedAudioOutput,
    refreshDevices,
  } = useMediaDevices();

  const { remoteStreams, peersRef, pendingSignalsRef, setRemoteStreams } =
    usePeerConnections();

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

  useRoomEvents({ streamRef, peersRef, pendingSignalsRef, setRemoteStreams });

  useEffect(() => {
    room.setPresence({
      media: { camera: cameraOn, mic: micOn, speaker: speakerOn },
    });
  }, [room, cameraOn, micOn, speakerOn]);

  const remoteMicStates = Object.fromEntries(
    Object.entries(media).map(([id, state]) => [id, state.mic])
  );
  const remoteSpeakerStates = Object.fromEntries(
    Object.entries(media).map(([id, state]) => [id, state.speaker])
  );

  return (
    <div className="relative flex h-full flex-col bg-[color:var(--panel-background)] p-2">
      <VideoGrid
        audioOutput={selectedAudioOutput}
        cameraOn={cameraOn}
        micOn={micOn}
        remoteMicStates={remoteMicStates}
        remoteSpeakerStates={remoteSpeakerStates}
        remoteStreams={remoteStreams}
        speakerOn={speakerOn}
        users={users}
        videoRef={videoRef}
      />

      {error && (
        <p
          className="absolute bottom-14 left-1/2 w-max max-w-[90%] -translate-x-1/2 bg-destructive/10 px-2 py-1 text-center text-destructive text-xs"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4">
        <div className="flex items-center gap-2">
          <DeviceControls
            devices={videoDevices}
            icon={cameraOn ? Video : VideoOff}
            isEnabled={cameraOn}
            label="camera"
            onDeviceSelect={(deviceId) =>
              handleVideoDeviceSwitch(
                deviceId,
                peersRef,
                setRemoteStreams,
                pendingSignalsRef,
                setSelectedVideoDevice
              )
            }
            onRefreshDevices={refreshDevices}
            onToggle={() =>
              handleToggleCamera(peersRef, setRemoteStreams, pendingSignalsRef)
            }
            selectedDevice={selectedVideoDevice}
          />

          {isMobile && cameraOn && (
            <Button
              aria-label="Rotate camera"
              className="bg-foreground/10 hover:bg-foreground/20"
              onClick={() => {
                clearWebcamError();
                handleRotateCamera(
                  peersRef,
                  setRemoteStreams,
                  pendingSignalsRef
                );
              }}
              size="icon"
              variant="ghost"
            >
              <RefreshCw className="size-5" />
            </Button>
          )}
        </div>

        <DeviceControls
          devices={audioInputDevices}
          icon={micOn ? Mic : MicOff}
          isEnabled={micOn}
          label="microphone"
          onDeviceSelect={(deviceId) =>
            handleAudioDeviceSwitch(
              deviceId,
              peersRef,
              setRemoteStreams,
              pendingSignalsRef,
              setSelectedAudioInput
            )
          }
          onRefreshDevices={refreshDevices}
          onToggle={() =>
            handleToggleMic(peersRef, setRemoteStreams, pendingSignalsRef)
          }
          selectedDevice={selectedAudioInput}
        />

        <DeviceControls
          devices={audioOutputDevices}
          icon={speakerOn ? Volume2 : VolumeOff}
          isEnabled={speakerOn}
          label="speaker"
          onDeviceSelect={setSelectedAudioOutput}
          onRefreshDevices={refreshDevices}
          onToggle={() => handleToggleSpeaker(!speakerOn)}
          selectedDevice={selectedAudioOutput}
        />
      </div>
    </div>
  );
};

export { WebcamStream };
