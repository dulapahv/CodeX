"use client";

import { Bug } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function TestCrash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Button
        variant="default"
        onClick={() => {
          throw new Error('Test Error');
        }}
      >
        <Bug className="size-4" />
        Trigger Error
      </Button>
    </div>
  );
}
