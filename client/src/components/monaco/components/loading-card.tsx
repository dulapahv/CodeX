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
 * - [`LoaderCircle`](lucide-react) for the loading animation
 * - Tailwind CSS for styling and animations
 *
 * @returns A centered alert component with loading spinner and setup message
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const LoadingCard = memo(() => (
  <div className="fixed left-0 top-0 flex size-full items-center justify-center p-2 backdrop-blur-sm">
    <Alert className="max-w-md bg-background/50">
      <LoaderCircle className="size-5 animate-spin" />
      <AlertTitle>Setting up editor</AlertTitle>
      <AlertDescription>
        Setting up the editor for you. Please wait...
      </AlertDescription>
    </Alert>
  </div>
));

LoadingCard.displayName = 'LoadingCard';
