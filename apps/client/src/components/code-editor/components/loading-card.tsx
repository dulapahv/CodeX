/**
 * Loading overlay component shown while editor initializes.
 * Features:
 * - Centered alert with spinner
 * - Blurred backdrop
 * - Description message
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { memo } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/spinner';

export const LoadingCard = memo(() => (
  <div
    className="fixed left-0 top-0 flex size-full items-center justify-center p-2
      backdrop-blur-sm"
  >
    <Alert className="bg-background/50 flex max-w-md gap-x-2">
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
