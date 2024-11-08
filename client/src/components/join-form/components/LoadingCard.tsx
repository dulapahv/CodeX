import { LoaderCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';

export const LoadingCard = () => (
  <div className="flex h-dvh animate-fade-in items-center justify-center">
    <Alert className="w-[448px]">
      <div className="flex items-center gap-2">
        <LoaderCircle className="size-5 animate-spin" />
        <AlertDescription>
          You will be redirected to the room shortly.
        </AlertDescription>
      </div>
    </Alert>
  </div>
);
