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
