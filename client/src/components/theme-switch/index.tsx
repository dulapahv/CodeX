'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const ThemeSwitch = () => {
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Trigger = (
    <Button
      variant="ghost"
      size="icon"
      className="fixed bottom-2 right-16 hover:bg-accent/50"
      aria-label="Change theme"
    >
      <Palette className="size-5" />
    </Button>
  );

  if (!mounted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{Trigger}</TooltipTrigger>
        <TooltipContent side="top">
          <p>Change theme</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: Sun,
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: Moon,
    },
    {
      value: 'system',
      label: 'System',
      icon: Monitor,
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{Trigger}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>Change theme</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="mr-1 w-48 bg-background/50 backdrop-blur"
        side="top"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <RadioGroup value={theme} onValueChange={setTheme}>
          {themes.map(({ value, label, icon: Icon }) => (
            <div key={value} className="flex items-center space-x-2 space-y-0">
              <RadioGroupItem value={value} id={value} />
              <Label
                htmlFor={value}
                className="flex flex-1 cursor-pointer items-center space-x-3 rounded-md p-1"
              >
                <Icon className="size-5" />
                <p className="text-sm font-medium leading-none">{label}</p>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </PopoverContent>
    </Popover>
  );
};

export { ThemeSwitch };
