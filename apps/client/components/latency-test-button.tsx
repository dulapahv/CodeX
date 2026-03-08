/**
 * Navigation button component that links to latency testing page.
 * Features:
 * - Icon button with tooltip
 * - Route change handling
 * - Accessible label
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

"use client";

import { Gauge } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const LatencyTestButton = () => {
  const router = useRouter();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            className="size-5 text-white hover:bg-transparent hover:text-muted-foreground"
            onClick={() => router.push("/test/latency")}
            size="icon"
            variant="ghost"
          >
            <Gauge className="size-5" />
            <span className="sr-only">Test Latency</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="mr-1" side="top">
          <p>Test Latency</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { LatencyTestButton };
