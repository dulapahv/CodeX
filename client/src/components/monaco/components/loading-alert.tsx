import { memo } from "react";
import { LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const LoadingAlert = memo(() => (
  <Alert className="max-w-md">
    <LoaderCircle className="size-5 animate-spin" />
    <AlertTitle>Setting up editor</AlertTitle>
    <AlertDescription>
      Setting up the editor for you. Please wait...
    </AlertDescription>
  </Alert>
));

LoadingAlert.displayName = "LoadingAlert";
