"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface SearchParamsProps {
  status: string;
}

export default function Page({
  searchParams,
}: {
  searchParams: SearchParamsProps;
}) {
  const { status } = searchParams;
  const isSuccessful = status === "success";

  useEffect(() => {
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage(
        {
          type: "github-oauth",
          success: isSuccessful,
        },
        "*",
      );
    }
  }, [isSuccessful]);

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
