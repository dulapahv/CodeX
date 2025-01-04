import { Skeleton } from '@/components/ui/skeleton';

export const LoadingState = () => (
  <div className="flex h-full flex-col space-y-4 p-4">
    <div className="flex animate-fade-in-top items-center space-x-4">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-20%)]" />
    </div>
    <div
      className="flex animate-fade-in-top items-center space-x-4 [animation-delay:25ms]
        [transition-delay:25ms]"
    >
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-30%)]" />
    </div>
    <div
      className="flex animate-fade-in-top items-center space-x-4 pl-6 [animation-delay:50ms]
        [transition-delay:50ms]"
    >
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-35%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 pl-6 delay-75">
      <Skeleton className="size-4 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-25%)]" />
    </div>
    <div className="flex animate-fade-in-top items-center space-x-4 delay-100">
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-4 w-[calc(100%-15%)]" />
    </div>
  </div>
);
