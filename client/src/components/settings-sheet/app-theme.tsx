import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function AppThemeSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-y-2">
      <Label className="font-normal">Theme</Label>
      <Select value={theme} onValueChange={setTheme}>
        <SelectTrigger>
          <SelectValue aria-label={theme} placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="system">
              <div className="flex items-center">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </div>
            </SelectItem>
            <SelectItem value="dark">
              <div className="flex items-center">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </div>
            </SelectItem>
            <SelectItem value="light">
              <div className="flex items-center">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
