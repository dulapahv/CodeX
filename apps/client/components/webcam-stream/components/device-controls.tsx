/**
 * Device controls component for managing media devices.
 * Features:
 * - Device selection dropdown
 * - Enable/disable toggle
 * - Permission handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { type ElementType, useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { MediaDevice } from "../types";
import { clearWebcamError, reportWebcamError } from "../utils/errors";

interface DeviceButtonProps {
  devices: MediaDevice[];
  disabled?: boolean;
  icon: ElementType;
  isEnabled: boolean;
  label: string;
  onDeviceSelect: (deviceId: string) => void;
  onRefreshDevices: () => Promise<void>;
  onToggle: () => void;
  selectedDevice: string;
}

const DeviceControls = ({
  icon: Icon,
  label,
  devices,
  selectedDevice,
  onDeviceSelect,
  onToggle,
  isEnabled,
  disabled = false,
  onRefreshDevices,
}: DeviceButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const validDevices = devices.filter((device) => device.deviceId !== "");
  const hasValidDevices = validDevices.length > 0;

  const requestPermissions = useCallback(async () => {
    const getDeviceKind = () => {
      switch (label.toLowerCase()) {
        case "camera":
          return "videoinput";
        case "microphone":
          return "audioinput";
        case "speaker":
          return "audiooutput";
        default:
          return null;
      }
    };
    try {
      const deviceKind = getDeviceKind();
      if (!deviceKind) {
        return false;
      }

      if (deviceKind === "audiooutput") {
        // For speakers, we need to handle them differently
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasOutputDevices = devices.some(
          (device) =>
            device.kind === "audiooutput" && device.deviceId && device.label
        );

        if (!hasOutputDevices) {
          // If no labeled output devices found, request audio input permission
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          for (const track of stream.getTracks()) {
            track.stop();
          }
        }
      } else {
        // For camera and microphone
        const constraints = {
          [deviceKind === "videoinput" ? "video" : "audio"]: true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        for (const track of stream.getTracks()) {
          track.stop();
        }
      }

      await onRefreshDevices();

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      reportWebcamError(
        `Please grant ${label.toLowerCase()} permissions to see available devices`
      );
      return false;
    }
  }, [label, onRefreshDevices]);

  const handleOpenChange = async (open: boolean) => {
    clearWebcamError();
    setIsOpen(open);
    if (open && hasValidDevices) {
      await onRefreshDevices();
    } else if (open) {
      const success = await requestPermissions();
      if (!success) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              aria-label={`Toggle ${label}`}
              className={cn(
                isEnabled
                  ? "bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)]"
                  : "bg-black/70 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20",
                "bg-clip-border",
                disabled && "opacity-50"
              )}
              disabled={disabled}
              onClick={() => {
                clearWebcamError();
                onToggle();
              }}
              size="icon"
              type="button"
            >
              <Icon className="size-5" />
            </Button>
          }
        />
        <TooltipContent>
          {isEnabled ? `Turn off ${label}` : `Turn on ${label}`}
        </TooltipContent>
      </Tooltip>

      <Select
        disabled={disabled}
        onOpenChange={handleOpenChange}
        onValueChange={(deviceId) => {
          if (deviceId !== null) {
            onDeviceSelect(deviceId);
          }
        }}
        open={isOpen}
        value={
          hasValidDevices
            ? selectedDevice || validDevices[0]?.deviceId
            : "default"
        }
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <SelectTrigger
                aria-label={`Select ${label} device`}
                className={cn(
                  "w-5 border-0 p-0 transition-all hover:bg-foreground/20 [&>svg]:w-full [&>svg]:rotate-180",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              />
            }
          />
          <TooltipContent>Select {label}</TooltipContent>
        </Tooltip>
        <SelectContent className="w-auto" finalFocus={false}>
          {hasValidDevices ? (
            validDevices.map((device) => (
              <SelectItem
                className="gap-2"
                key={device.deviceId}
                value={device.deviceId}
              >
                {device.label || `${label} ${device.deviceId.slice(0, 4)}`}
              </SelectItem>
            ))
          ) : (
            <SelectItem
              className="text-muted-foreground italic"
              value="default"
            >
              Allow {label.toLowerCase()} access...
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export { DeviceControls };
