/**
 * Theme provider component that wraps the application to handle
 * theme switching.
 * Uses next-themes under the hood to manage light/dark themes.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
