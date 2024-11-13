/**
 * This component is responsible for rendering a loading alert that is displayed
 * when the editor is being set up.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)..
 */

import { memo } from 'react';
import { LoaderCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const LoadingCard = memo(() => (
  <div className="fixed left-0 top-0 flex size-full items-center justify-center p-2">
    <Alert className="max-w-md">
      <LoaderCircle className="size-5 animate-spin" />
      <AlertTitle>Setting up editor</AlertTitle>
      <AlertDescription>
        Setting up the editor for you. Please wait...
      </AlertDescription>
    </Alert>
  </div>
));

LoadingCard.displayName = 'LoadingCard';
