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
 * - [`LoaderCircle`](lucide-react) for the loading animation
 * - Tailwind CSS for styling and animations
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { LoaderCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const RedirectingCard = () => (
  <div className="flex size-full animate-fade-in items-center justify-center">
    <Alert className="max-w-md">
      <LoaderCircle className="size-5 animate-spin" />
      <AlertTitle>Redirecting</AlertTitle>
      <AlertDescription>
        You will be redirected to the room shortly.
      </AlertDescription>
    </Alert>
  </div>
);
