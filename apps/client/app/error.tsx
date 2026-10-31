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

import {
  ArrowCounterClockwiseIcon,
  BugIcon,
  HouseIcon,
} from "@phosphor-icons/react";
import * as Sentry from "@sentry/nextjs";
import type { Route } from "next";
import Link from "next/link";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { BASE_CLIENT_URL, CONTACT_URL, IS_DEV_ENV } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function ErrorPage({
  error,
  reset,
}: {
  error: globalThis.Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

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
        <AlertTitle className="text-xl font-semibold">
          Something went wrong!
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          {error.message ||
            "An unexpected error occurred. Please try again later."}
          {error.digest && (
            <p className="text-muted-foreground mt-2 text-sm">
              Error ID: {error.digest}
            </p>
          )}
        </AlertDescription>
        <div className="mt-6 flex flex-col justify-end gap-4 sm:flex-row">
          <Button className="gap-2" onClick={() => reset()} variant="outline">
            <ArrowCounterClockwiseIcon className="size-4" />
            Try Again
          </Button>
          <Link
            className={cn(
              buttonVariants({ className: "gap-2", variant: "outline" })
            )}
            href={generateErrorReport() as Route}
            target="_blank"
          >
            <BugIcon className="size-4" />
            Report Issue
          </Link>
          <Link
            className={cn(
              buttonVariants({ className: "gap-2", variant: "default" })
            )}
            href={BASE_CLIENT_URL}
          >
            <HouseIcon className="size-4" />
            Return Home
          </Link>
        </div>
      </Alert>
    </div>
  );
}
