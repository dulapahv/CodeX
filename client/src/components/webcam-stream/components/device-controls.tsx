import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import type { MediaDevice } from '../types';

interface DeviceButtonProps {
  icon: React.ElementType;
  label: string;
  devices: MediaDevice[];
  selectedDevice: string;
  onDeviceSelect: (deviceId: string) => void;
  onToggle: () => void;
  isEnabled: boolean;
  disabled?: boolean;
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
}: DeviceButtonProps) => (
  <div className="flex items-center">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={onToggle}
          className={cn(
            isEnabled
              ? 'bg-[color:var(--toolbar-accent)] text-[color:var(--panel-text-accent)] hover:bg-[color:var(--toolbar-accent)]'
              : 'bg-black/70 hover:bg-black/80 dark:bg-white/10 dark:hover:bg-white/20',
            'rounded-r-none',
          )}
          size="icon"
          disabled={disabled}
          type="button"
          aria-label={`Toggle ${label}`}
        >
          <Icon className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isEnabled ? `Turn off ${label}` : `Turn on ${label}`}
      </TooltipContent>
    </Tooltip>

    <Select
      value={selectedDevice || undefined}
      onValueChange={onDeviceSelect}
      disabled={disabled}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SelectTrigger
            className="h-10 w-5 rounded-l-none border-0 p-0 hover:bg-foreground/20 [&>svg]:w-full"
            aria-label={`Select ${label} device`}
          ></SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>Select {label}</TooltipContent>
      </Tooltip>
      <SelectContent
        onCloseAutoFocus={(event) => {
          event.preventDefault();
        }}
      >
        {devices.map((device) => (
          <SelectItem
            key={device.deviceId}
            value={device.deviceId}
            className="gap-2"
          >
            {device.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export { DeviceControls };
