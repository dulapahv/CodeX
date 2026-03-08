/**
 * Spinner loading indicator component with customizable variants.
 * Features:
 * - Size variants: sm, default, lg
 * - Color variants: default, primary, secondary, destructive, muted
 * - Smooth animation
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const spinnerVariants = cva(
  "relative inline-block aspect-square transform-gpu",
  {
    variants: {
      variant: {
        default: "[&>div]:bg-foreground",
        primary: "[&>div]:bg-primary",
        secondary: "[&>div]:bg-secondary",
        destructive: "[&>div]:bg-destructive",
        muted: "[&>div]:bg-muted-foreground",
      },
      size: {
        sm: "size-4",
        default: "size-5",
        lg: "size-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface SpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof spinnerVariants>, "size"> {
  className?: string;
  size?: VariantProps<typeof spinnerVariants>["size"] | number;
}

const Spinner = ({ className, variant, size = "default" }: SpinnerProps) => (
  // biome-ignore lint/a11y/useSemanticElements: spinner component using div for styling
  <div
    aria-label="Loading"
    className={cn(
      typeof size === "string"
        ? spinnerVariants({ variant, size })
        : spinnerVariants({ variant }),
      className
    )}
    role="status"
    style={typeof size === "number" ? { width: size, height: size } : undefined}
  >
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        aria-hidden="true"
        className="absolute top-[4.4%] left-[46.5%] h-[24%] w-[7%] origin-[center_190%] animate-spinner rounded-full opacity-[0.1] will-change-transform"
        // biome-ignore lint/suspicious/noArrayIndexKey: static spinner bars never reorder
        key={i}
        style={{
          transform: `rotate(${i * 30}deg)`,
          animationDelay: `${(i * 0.083).toFixed(3)}s`,
        }}
      />
    ))}
    <span className="sr-only">Loading...</span>
  </div>
);

export { Spinner, spinnerVariants };
