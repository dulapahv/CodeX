'use client';

import { useEffect, useState } from 'react';
import { Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        className="mr-1 w-48 bg-background/50 p-0 backdrop-blur"
        side="top"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Tabs
          defaultValue={theme}
          orientation="vertical"
          onValueChange={setTheme}
        >
          <TabsList className="flex h-auto flex-col gap-1 bg-transparent">
            {themes.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="w-full justify-start gap-2 px-3 data-[state=active]:bg-background/90"
              >
                <Icon className="size-5" />
                <span className="text-sm font-medium">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export { ThemeSwitch };
