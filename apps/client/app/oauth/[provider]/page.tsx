/**
 * OAuth callback page that reports a git provider sign-in to the window that
 * opened it.
 * Features:
 * - Status message display
 * - Parent window messaging
 * - Automatic window handling
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { isProviderId, PROVIDER_LABELS } from "@/lib/git-providers/types";

export default function Page() {
  const { provider } = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const isSuccessful = searchParams.get("status") === "success";
  const description = searchParams.get("description");
  const label = isProviderId(provider) ? PROVIDER_LABELS[provider] : "Sign-in";

  useEffect(() => {
    window.opener?.postMessage(
      { type: "git-oauth", provider, success: isSuccessful },
      window.location.origin
    );
  }, [provider, isSuccessful]);

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
          <AlertTitle>{label} sign-in failed</AlertTitle>
          <AlertDescription>
            {description || "Something went wrong."} Close this window and try
            again.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
