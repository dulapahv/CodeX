/**
 * Loading card component shown while redirecting to room.
 * Features:
 * - Animated fade in
 * - Spinner indicator
 * - Accessible status message
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

export const RedirectingCard = () => (
  <div
    aria-live="polite"
    className="animate-fade-in w-full max-w-md backdrop-blur-xs"
    role="status"
  >
    <Alert
      aria-describedby="redirect-description"
      aria-labelledby="redirect-title"
      className="bg-background/50 flex gap-x-2"
    >
      <Spinner className="size-6" />
      <div>
        <AlertTitle id="redirect-title">Redirecting</AlertTitle>
        <AlertDescription id="redirect-description">
          You will be redirected to the room shortly.
        </AlertDescription>
      </div>
    </Alert>
  </div>
);
