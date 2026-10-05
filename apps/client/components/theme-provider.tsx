/**
 * Theme provider component that enables dark/light mode support.
 * Features:
 * - System theme detection
 * - Theme persistence
 * - Theme switching
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
