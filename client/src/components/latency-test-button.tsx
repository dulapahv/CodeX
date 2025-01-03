'use client';

import { useRouter } from 'next/navigation';
import { Gauge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const LatencyTestButton = () => {
  const router = useRouter();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-5 text-white hover:bg-transparent hover:text-muted-foreground"
            onClick={() => router.push('/test/latency')}
          >
            <Gauge className="size-5" />
            <span className="sr-only">Test Latency</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="mr-1">
          <p>Test Latency</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { LatencyTestButton };
