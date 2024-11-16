'use client';

import Link from 'next/link';
import { Bug, RefreshCcw } from 'lucide-react';

import { IS_DEV_ENV, PORTFOLIO_URL } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export default function GlobalError({
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

    return `${PORTFOLIO_URL}/contact?type=other&message=${encodeURIComponent(errorMessage)}`;
  };

  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <Alert className="max-w-lg">
            <AlertTitle className="text-xl font-semibold">
              Critical Error
            </AlertTitle>
            <AlertDescription className="text-muted-foreground">
              A critical error has occurred. We apologize for the inconvenience.
              {error.digest && (
                <p className="mt-2 text-sm text-muted-foreground">
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
