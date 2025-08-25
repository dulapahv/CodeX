/**
 * Theme provider component that enables dark/light mode support.
 * Features:
 * - System theme detection
 * - Theme persistence
 * - Theme switching
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
