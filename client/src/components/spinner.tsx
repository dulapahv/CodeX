/**
 * A loading spinner component that supports multiple variants and sizes.
 * @example
 * ```tsx
 * <Spinner variant="primary" size="lg" />
 * <Spinner size={32} />
 * ```
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'relative inline-block aspect-square transform-gpu',
  {
    variants: {
      variant: {
        default: '[&>div]:bg-foreground',
        primary: '[&>div]:bg-primary',
        secondary: '[&>div]:bg-secondary',
        destructive: '[&>div]:bg-destructive',
        muted: '[&>div]:bg-muted-foreground',
      },
      size: {
        default: 'size-5',
        sm: 'size-4',
        lg: 'size-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface SpinnerProps
  extends Omit<VariantProps<typeof spinnerVariants>, 'size'> {
  className?: string;
  size?: VariantProps<typeof spinnerVariants>['size'] | number;
}

const Spinner = ({ className, variant, size = 'default' }: SpinnerProps) => {
  const opacities = [
    1, 0.6, 0.4, 0.4, 0.3, 0.3, 0.2, 0.2, 0.15, 0.15, 0.1, 0.1,
  ];

  const blades = Array.from({ length: 12 }).map((_, index) => {
    const rotationDegrees = index * 30;
    const delaySeconds = (index * 0.083).toFixed(3);
    const initialOpacity = opacities[index];

    return (
      <div
        key={index}
        className="animate-spinner absolute left-[46.5%] top-[4.4%] h-[24%] w-[7%] origin-[center_190%] rounded-full will-change-transform"
        style={{
          transform: `rotate(${rotationDegrees}deg)`,
          animationDelay: `${delaySeconds}s`,
          opacity: initialOpacity,
        }}
        aria-hidden="true"
      />
    );
  });

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        typeof size === 'string'
          ? spinnerVariants({ variant, size })
          : spinnerVariants({ variant }),
        className,
      )}
      style={
        typeof size === 'number'
          ? {
              width: size,
              height: size,
            }
          : undefined
      }
    >
      {blades}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { Spinner, spinnerVariants };
