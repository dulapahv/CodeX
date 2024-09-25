import type { Metadata } from "next";
import { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import "./globals.css";

export const metadata: Metadata = {
  title: "Online Code Collaboration Platform",
  description:
    "Web-based platform with which 2 colleagues can remotely, but seamlessly, collaborate on software development tasks.",
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("h-dvh", GeistSans.className)}>
        <ThemeProvider attribute="class">
          {children}
          <Toaster richColors className="whitespace-pre-line" />
        </ThemeProvider>
      </body>
    </html>
  );
}
