/**
 * Back button component that navigates back to room creation/joining.
 * Features:
 * - Click handling
 * - Disabled state support
 * - Accessible button with label
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface BackButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const BackButton = ({ onClick, disabled }: BackButtonProps) => (
  <Button
    variant="link"
    className="text-foreground size-fit p-0"
    size="sm"
    onClick={onClick}
    disabled={disabled}
    aria-label="Back to create or join room page"
  >
    <ArrowLeft className="mr-2 size-4" aria-hidden="true" />
    <span>Back to create/join room</span>
  </Button>
);

export { BackButton };
