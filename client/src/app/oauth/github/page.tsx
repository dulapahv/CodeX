"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SearchParamsProps {
  status: string;
  description: string;
  username?: string;
}

export default function Page({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) {
  const { status, username } = searchParams;
  const isSuccessful = status === "success";

  useEffect(() => {
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage(
        {
          type: "github-oauth",
          success: isSuccessful,
          username: username,
        },
        "*",
      );
    }
  }, [isSuccessful, username]);

  return (
    <div className="flex h-dvh animate-fade-in items-center justify-center">
      <Alert className="max-w-md">
        <div className="flex items-center gap-2">
          <LoaderCircle className="size-5 animate-spin" />
          <AlertDescription>Processing authentication...</AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
