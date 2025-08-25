/**
 * Loading skeleton component that displays animated placeholder content.
 * Features:
 * - Sequentially fading animation
 * - Indentation structure simulation
 * - Variable width placeholders
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Skeleton } from '@/components/ui/skeleton';

export const LoadingState = () => (
  <div className="flex h-full flex-col space-y-4 p-4">
    <div className="animate-fade-in-top flex items-center space-x-4">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-20%)]" />
    </div>
    <div
      className="animate-fade-in-top flex items-center space-x-4 [animation-delay:25ms]
        [transition-delay:25ms]"
    >
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-30%)]" />
    </div>
    <div
      className="animate-fade-in-top flex items-center space-x-4 pl-6 [animation-delay:50ms]
        [transition-delay:50ms]"
    >
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-35%)]" />
    </div>
    <div className="animate-fade-in-top flex items-center space-x-4 pl-6 delay-75">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-25%)]" />
    </div>
    <div className="animate-fade-in-top flex items-center space-x-4 delay-100">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-15%)]" />
    </div>
  </div>
);
