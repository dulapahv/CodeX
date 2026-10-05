/**
 * Shown in a repository dialog when the selected provider isn't connected.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { PROVIDER_LABELS, type ProviderId } from "@/lib/git-providers/types";
import { connectProvider } from "@/lib/utils";

import { ProviderLogo } from "./provider-logo";

interface GitAuthPromptProps {
  configured: boolean;
  isLoading: boolean;
  promptText: string;
  provider: ProviderId;
}

export const GitAuthPrompt = ({
  configured,
  isLoading,
  promptText,
  provider,
}: GitAuthPromptProps) => {
  const label = PROVIDER_LABELS[provider];

  return (
    // biome-ignore lint/a11y/useSemanticElements: status div for auth loading/prompt state
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 md:px-0"
      role="status"
    >
      {isLoading ? (
        <Spinner className="size-8" />
      ) : (
        <>
          <p
            className="text-center text-muted-foreground text-sm"
            id="login-prompt"
          >
            {configured ? promptText : `${label} isn't available yet.`}
          </p>
          {configured && (
            <Button
              aria-describedby="login-prompt"
              onClick={() => connectProvider(provider)}
              variant="outline"
            >
              <ProviderLogo provider={provider} />
              Connect to {label}
            </Button>
          )}
        </>
      )}
    </div>
  );
};
