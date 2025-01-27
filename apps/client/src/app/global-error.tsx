/**
 * Global error boundary component for handling runtime errors.
 * Features:
 * - Error reporting
 * - Recovery options
 * - Development error details
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useEffect } from 'react';
import Error from 'next/error';
import Link from 'next/link';

import * as Sentry from '@sentry/nextjs';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { Bug, RefreshCcw } from 'lucide-react';

import { CONTACT_URL } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const generateErrorReport = () => {
    const timestamp = new Date().toISOString();
    const errorMessage = `Error Details:
Time: ${timestamp}
Digest: ${error.digest || 'No digest available'}
URL: ${window.location.href}`;

    return `${CONTACT_URL}?type=other&message=${encodeURIComponent(errorMessage)}`;
  };

  return (
    <html className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Alert className="max-w-lg">
            <AlertTitle className="text-xl font-semibold">
              Critical Error
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              A critical error has occurred. We apologize for the inconvenience.
              {error.digest && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Error ID: {error.digest}
                </p>
              )}
            </AlertDescription>
            <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
              <Button variant="outline" asChild className="gap-2">
                <Link href={generateErrorReport()} target="_blank">
                  <Bug className="size-4" />
                  Report Issue
                </Link>
              </Button>
              <Button
                variant="default"
                onClick={() => reset()}
                className="gap-2"
              >
                <RefreshCcw className="size-4" />
                Reload Application
              </Button>
            </div>
          </Alert>
        </div>
      </body>
    </html>
  );
}
