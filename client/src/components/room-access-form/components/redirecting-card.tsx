/**
 * RedirectingCard component that displays a loading state with animation
 * while redirecting users to a room.
 *
 * @example
 * ```tsx
 * <RedirectingCard />
 * ```
 *
 * @returns A centered alert component with loading spinner and redirect message
 *
 * @remarks
 * Uses the following components:
 * - [`Alert`](src/components/ui/alert.tsx) for the container
 * - Tailwind CSS for styling and animations
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Spinner } from '@/components/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const RedirectingCard = () => (
  <div
    className="w-full max-w-md animate-fade-in backdrop-blur-sm"
    role="status"
    aria-live="polite"
  >
    <Alert
      className="flex gap-x-2 bg-background/50"
      aria-labelledby="redirect-title"
      aria-describedby="redirect-description"
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
