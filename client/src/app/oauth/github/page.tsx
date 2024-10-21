import { Check, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface searchParamsProps {
  status: string;
  description: string;
}

export default async function Page({
  searchParams,
}: {
  searchParams: searchParamsProps;
}) {
  const { status, description } = searchParams;

  const isSuccessful = status === "success";

  return (
    <div className="flex h-dvh animate-fade-in items-center justify-center">
      <Alert className="max-w-md">
        {isSuccessful ? <Check className="size-5" /> : <X className="size-5" />}
        <AlertTitle>
          {isSuccessful
            ? "Successfully connected to GitHub"
            : "Error connecting to GitHub"}
        </AlertTitle>
        <AlertDescription className="whitespace-pre-line">
          {isSuccessful
            ? "You can now close this tab and return to the app."
            : `${description}\nYou can close this tab and try again.`}
        </AlertDescription>
      </Alert>
    </div>
  );
}
