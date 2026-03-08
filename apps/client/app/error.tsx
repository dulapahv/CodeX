/**
 * Error boundary component for handling runtime errors.
 * Features:
 * - Error reporting
 * - Recovery options
 * - Development error details
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { Bug, Home, RefreshCcw } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BASE_CLIENT_URL, CONTACT_URL, IS_DEV_ENV } from "@/lib/constants";

export default function ErrorPage({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  const generateErrorReport = () => {
    const timestamp = new Date().toISOString();
    let errorMessage = `Error Details:
Time: ${timestamp}
Digest: ${error.digest || "No digest available"}
URL: ${window.location.href}`;

    if (IS_DEV_ENV) {
      errorMessage += `
Message: ${error.message || "Unknown error"}
Stack: ${error.stack || "No stack trace available"}`;
    }

    return `${CONTACT_URL}?type=other&message=${encodeURIComponent(errorMessage)}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Alert className="max-w-lg">
        <AlertTitle className="font-semibold text-xl">
          Something went wrong!
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          {error.message ||
            "An unexpected error occurred. Please try again later."}
          {error.digest && (
            <p className="mt-2 text-muted-foreground text-sm">
              Error ID: {error.digest}
            </p>
          )}
        </AlertDescription>
        <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
          <Button className="gap-2" onClick={() => reset()} variant="outline">
            <RefreshCcw className="size-4" />
            Try Again
          </Button>
          <Button asChild className="gap-2" variant="outline">
            <Link href={generateErrorReport() as Route} target="_blank">
              <Bug className="size-4" />
              Report Issue
            </Link>
          </Button>
          <Button asChild className="gap-2" variant="default">
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
