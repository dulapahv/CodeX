/**
 * OAuth callback page component that handles GitHub authentication response.
 * Displays loading state and communicates authentication result to parent window.
 * Features:
 * - Status message display
 * - Parent window messaging
 * - Automatic window handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export default function Page() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isSuccessful = status === "success";
  const description = searchParams.get("description");

  useEffect(() => {
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage(
        {
          type: "github-oauth",
          success: isSuccessful,
        },
        window.location.origin
      );
    }
  }, [isSuccessful]);

  return (
    <main className="fixed top-0 left-0 flex size-full items-center justify-center p-2">
      {isSuccessful ? (
        <Alert className="flex max-w-md gap-x-2 bg-background/50 backdrop-blur">
          <Spinner className="size-6" />
          <div>
            <AlertTitle>Processing authentication...</AlertTitle>
            <AlertDescription>
              This window will close automatically in a few seconds.
            </AlertDescription>
          </div>
        </Alert>
      ) : (
        <Alert className="max-w-md" variant="destructive">
          <AlertTitle>GitHub sign-in failed</AlertTitle>
          <AlertDescription>
            {description || "Something went wrong."} Close this window and try
            again.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
