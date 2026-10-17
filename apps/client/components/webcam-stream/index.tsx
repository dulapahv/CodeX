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
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
  Volume2,
  VolumeOff,
} from "lucide-react";
import type { MediaDevice as CallDevice } from "partytracks/client";
import { useObservableAsValue } from "partytracks/react";
import { useMemo } from "react";
import { isMobile } from "react-device-detect";
import { map, of } from "rxjs";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CallSource } from "@/lib/realtime/call";
import { usePresenceSelector } from "@/lib/realtime/room-context";
import { cn } from "@/lib/utils";

import { useCall, useLocalCameraTrack } from "./call-provider";
import { DeviceControls } from "./components/device-controls";
import { VideoGrid } from "./components/video-grid";
import { useMediaDevices } from "./hooks/useMediaDevices";
import { clearWebcamError, useWebcamError } from "./utils/errors";

interface WebcamStreamProps {
  users: User[];
}

type MediaByUser = Record<string, PresenceMedia>;

const NO_DEVICE_ID$ = of("");

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

const canShareScreen = () =>
  !isMobile && Boolean(navigator.mediaDevices?.getDisplayMedia);

const useActiveDeviceId = (device: CallDevice | undefined) => {
  const deviceId$ = useMemo(
    () =>
      device
        ? device.activeDevice$.pipe(map(({ deviceId }) => deviceId))
        : NO_DEVICE_ID$,
    [device]
  );
  return useObservableAsValue(deviceId$, "");
};

// PartyTracks switches the live track and remembers the choice
const preferDevice = async (
  device: CallDevice | undefined,
  kind: MediaDeviceKind,
  deviceId: string
) => {
  const info = (await navigator.mediaDevices.enumerateDevices()).find(
    (candidate) => candidate.kind === kind && candidate.deviceId === deviceId
  );
  if (device && info) {
    device.setPreferredDevice(info);
  }
};

const WebcamStream = ({ users }: WebcamStreamProps) => {
  const {
    audioOutput,
    call,
    cameraOn,
    notice,
    micOn,
    screenOn,
    setAudioOutput,
    setSpeakerOn,
    speakerOn,
    status,
  } = useCall();
  const error = useWebcamError();
  const media = usePresenceSelector(selectMedia, isSameMedia);
  const localTrack = useLocalCameraTrack();
  const {
    videoDevices,
    audioInputDevices,
    audioOutputDevices,
    refreshDevices,
  } = useMediaDevices();
  const activeCamera = useActiveDeviceId(call?.camera);
  const activeMic = useActiveDeviceId(call?.mic);

  const isDisabled = status !== "ready";

  const toggle = (source: CallSource, isOn: boolean) => {
    if (isOn) {
      call?.stop(source);
    } else {
      call?.start(source);
    }
  };

  // Front and back cameras are separate devices on mobile
  const rotateCamera = () => {
    const index = videoDevices.findIndex(
      (device) => device.deviceId === activeCamera
    );
    const next = videoDevices[(index + 1) % videoDevices.length];
    if (next) {
      preferDevice(call?.camera, "videoinput", next.deviceId);
    }
  };

  return (
    <div className="flex h-full flex-col gap-2 bg-[color:var(--panel-background)] p-2">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <VideoGrid
          cameraOn={cameraOn}
          localTrack={localTrack}
          media={media}
          micOn={micOn}
          speakerOn={speakerOn}
          users={users}
        />
      </div>

      {(error || notice) && (
        <p
          className="max-w-full self-center bg-destructive/10 px-2 py-1 text-center text-destructive text-xs"
          role="alert"
        >
          {error ?? notice}
        </p>
      )}

      {status === "unavailable" ? (
        <p className="text-center text-muted-foreground text-xs">
          Video calls aren't set up on this server.
        </p>
      ) : (
        // Wraps onto two rows when the panel is narrow
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <DeviceControls
              devices={videoDevices}
              disabled={isDisabled}
              icon={cameraOn ? Video : VideoOff}
              isEnabled={cameraOn}
              label="camera"
              onDeviceSelect={(deviceId) =>
                preferDevice(call?.camera, "videoinput", deviceId)
              }
              onRefreshDevices={refreshDevices}
              onToggle={() => toggle("camera", cameraOn)}
              selectedDevice={activeCamera}
            />

            {isMobile && cameraOn && (
              <Button
                aria-label="Rotate camera"
                className="bg-foreground/10 hover:bg-foreground/20"
                onClick={() => {
                  clearWebcamError();
                  rotateCamera();
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
            disabled={isDisabled}
            icon={micOn ? Mic : MicOff}
            isEnabled={micOn}
            label="microphone"
            onDeviceSelect={(deviceId) =>
              preferDevice(call?.mic, "audioinput", deviceId)
            }
            onRefreshDevices={refreshDevices}
            onToggle={() => toggle("mic", micOn)}
            selectedDevice={activeMic}
          />

          <DeviceControls
            devices={audioOutputDevices}
            icon={speakerOn ? Volume2 : VolumeOff}
            isEnabled={speakerOn}
            label="speaker"
            onDeviceSelect={setAudioOutput}
            onRefreshDevices={refreshDevices}
            onToggle={() => setSpeakerOn(!speakerOn)}
            selectedDevice={audioOutput}
          />

          {canShareScreen() && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    aria-label={
                      screenOn ? "Stop sharing screen" : "Share screen"
                    }
                    className={cn(
                      screenOn
                        ? "bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)]"
                        : "bg-black/70 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20",
                      "bg-clip-border"
                    )}
                    disabled={isDisabled}
                    onClick={() => {
                      clearWebcamError();
                      toggle("screen", screenOn);
                    }}
                    size="icon"
                    type="button"
                  >
                    {screenOn ? (
                      <ScreenShareOff className="size-5" />
                    ) : (
                      <ScreenShare className="size-5" />
                    )}
                  </Button>
                }
              />
              <TooltipContent>
                {screenOn ? "Stop sharing screen" : "Share screen"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
};

export { WebcamStream };
