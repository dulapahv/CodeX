import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export const BackButton = ({ onClick, disabled }: BackButtonProps) => (
  <Button
    variant="link"
    className="size-fit p-0 text-foreground"
    size="sm"
    onClick={onClick}
    disabled={disabled}
  >
    <ArrowLeft className="mr-2 size-4" />
    Back to create/join room
  </Button>
);
