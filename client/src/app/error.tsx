'use client';

import Link from 'next/link';
import { Bug, Home, RefreshCcw } from 'lucide-react';

import { PORTFOLIO_URL, SITE_URL } from '@/lib/constants';
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
    const errorMessage = `Error Details:
      Time: ${timestamp}
      Message: ${error.message || 'Unknown error'}
      Digest: ${error.digest || 'No digest available'}
      Stack: ${error.stack || 'No stack trace available'}
      URL: ${window.location.href}`;

    return `${PORTFOLIO_URL}/contact?type=other&message=${encodeURIComponent(errorMessage)}`;
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
            <p className="mt-2 text-sm text-muted-foreground">
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
            <Link href={SITE_URL}>
              <Home className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}
