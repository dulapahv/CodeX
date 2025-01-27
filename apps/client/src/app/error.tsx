/**
 * Error boundary component for handling runtime errors.
 * Features:
 * - Error reporting
 * - Recovery options
 * - Development error details
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import Link from 'next/link';

import { Bug, Home, RefreshCcw } from 'lucide-react';

import { BASE_CLIENT_URL, CONTACT_URL, IS_DEV_ENV } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const generateErrorReport = () => {
    const timestamp = new Date().toISOString();
    let errorMessage = `Error Details:
Time: ${timestamp}
Digest: ${error.digest || 'No digest available'}
URL: ${window.location.href}`;

    if (IS_DEV_ENV) {
      errorMessage += `
Message: ${error.message || 'Unknown error'}
Stack: ${error.stack || 'No stack trace available'}`;
    }

    return `${CONTACT_URL}?type=other&message=${encodeURIComponent(errorMessage)}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Alert className="max-w-lg">
        <AlertTitle className="text-xl font-semibold">
          Something went wrong!
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          {error.message ||
            'An unexpected error occurred. Please try again later.'}
          {error.digest && (
            <p className="text-muted-foreground mt-2 text-sm">
              Error ID: {error.digest}
            </p>
          )}
        </AlertDescription>
        <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
          <Button variant="outline" onClick={() => reset()} className="gap-2">
            <RefreshCcw className="size-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="gap-2">
            <Link href={generateErrorReport()} target="_blank">
              <Bug className="size-4" />
              Report Issue
            </Link>
          </Button>
          <Button variant="default" asChild className="gap-2">
            <Link href={BASE_CLIENT_URL}>
              <Home className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}
