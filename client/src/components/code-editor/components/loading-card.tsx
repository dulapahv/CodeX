/**
 * Loading card component that displays while the Monaco editor is initializing.
 * Shows a centered alert with spinner and loading message.
 *
 * @example
 * ```tsx
 * <LoadingCard />
 * ```
 *
 * @remarks
 * Uses the following components:
 * - [`Alert`](src/components/ui/alert.tsx) for the container
 * - Tailwind CSS for styling and animations
 *
 * @returns A centered alert component with loading spinner and setup message
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo } from 'react';

import { Spinner } from '@/components/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const LoadingCard = memo(() => (
  <div className="fixed left-0 top-0 flex size-full items-center justify-center p-2 backdrop-blur-sm">
    <Alert className="flex max-w-md gap-x-2 bg-background/50">
      <Spinner className="size-6" />
      <div>
        <AlertTitle>Setting up editor</AlertTitle>
        <AlertDescription>
          Setting up the editor for you. Please wait...
        </AlertDescription>
      </div>
    </Alert>
  </div>
));

LoadingCard.displayName = 'LoadingCard';
