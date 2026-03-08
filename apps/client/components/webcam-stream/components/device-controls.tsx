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

import { toast } from "sonner";
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

interface DeviceButtonProps {
  devices: MediaDevice[];
  disabled?: boolean;
  disableToggle?: boolean;
  icon: ElementType;
  isEnabled: boolean;
  label: string;
  onDevicePermissionGranted?: (
    kind: "videoinput" | "audioinput" | "audiooutput"
  ) => Promise<void>;
  onDeviceSelect: (deviceId: string) => void;
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
  disableToggle = false,
  onDevicePermissionGranted,
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

      // Only update the device list for this specific type
      if (onDevicePermissionGranted) {
        await onDevicePermissionGranted(deviceKind);
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      toast.error(
        `Please grant ${label.toLowerCase()} permissions to see available devices`
      );
      return false;
    }
  }, [label, onDevicePermissionGranted]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && !hasValidDevices) {
      const success = await requestPermissions();
      if (!success) {
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={`Toggle ${label}`}
            className={cn(
              isEnabled
                ? "bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)]"
                : "bg-black/70 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20",
              "rounded-r-none",
              (disabled || disableToggle) && "opacity-50"
            )}
            disabled={disabled || disableToggle}
            onClick={onToggle}
            size="icon"
            type="button"
          >
            <Icon className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {(() => {
            if (disableToggle) {
              return `Turn on camera first to use ${label}`;
            }
            return isEnabled ? `Turn off ${label}` : `Turn on ${label}`;
          })()}
        </TooltipContent>
      </Tooltip>

      <Select
        disabled={disabled}
        onOpenChange={handleOpenChange}
        onValueChange={onDeviceSelect}
        open={isOpen}
        value={
          hasValidDevices
            ? selectedDevice || validDevices[0]?.deviceId
            : "default"
        }
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger
              aria-label={`Select ${label} device`}
              className={cn(
                "h-10 w-5 rounded-l-none border-0 p-0 transition-all hover:bg-foreground/20 [&>svg]:w-full [&>svg]:rotate-180",
                disabled && "cursor-not-allowed opacity-50"
              )}
            />
          </TooltipTrigger>
          <TooltipContent>Select {label}</TooltipContent>
        </Tooltip>
        <SelectContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
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
