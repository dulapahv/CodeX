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

// Pre-calculated values for all 12 blades
const SPINNER_BLADES = [
  { rotation: 'rotate(0deg)', delay: '0.000s', opacity: 1 },
  { rotation: 'rotate(30deg)', delay: '0.083s', opacity: 0.7 },
  { rotation: 'rotate(60deg)', delay: '0.166s', opacity: 0.3 },
  { rotation: 'rotate(90deg)', delay: '0.249s', opacity: 0.2 },
  { rotation: 'rotate(120deg)', delay: '0.332s', opacity: 0.1 },
  { rotation: 'rotate(150deg)', delay: '0.415s', opacity: 0.1 },
  { rotation: 'rotate(180deg)', delay: '0.498s', opacity: 0.1 },
  { rotation: 'rotate(210deg)', delay: '0.581s', opacity: 0.1 },
  { rotation: 'rotate(240deg)', delay: '0.664s', opacity: 0.1 },
  { rotation: 'rotate(270deg)', delay: '0.747s', opacity: 0.1 },
  { rotation: 'rotate(300deg)', delay: '0.830s', opacity: 0.1 },
  { rotation: 'rotate(330deg)', delay: '0.913s', opacity: 0.1 },
];

const Spinner = ({ className, variant, size = 'default' }: SpinnerProps) => {
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
      {SPINNER_BLADES.map((blade, index) => (
        <div
          key={index}
          className="animate-spinner absolute left-[46.5%] top-[4.4%] h-[24%] w-[7%] origin-[center_190%] rounded-full will-change-transform"
          style={{
            transform: blade.rotation,
            animationDelay: blade.delay,
            opacity: blade.opacity,
          }}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export { Spinner, spinnerVariants };
