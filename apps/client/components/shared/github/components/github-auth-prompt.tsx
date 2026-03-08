/**
 * GitHub authentication prompt component.
 * Displays login button or loading spinner based on auth state.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from "next/image";

import { useTheme } from "next-themes";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { loginWithGithub } from "@/lib/utils";

interface GithubAuthPromptProps {
  githubUser: string | null;
  isLoading: boolean;
  promptText?: string;
}

export const GithubAuthPrompt = ({
  isLoading,
  githubUser,
  promptText = "Please connect to GitHub to continue.",
}: GithubAuthPromptProps) => {
  const { resolvedTheme } = useTheme();

  if (githubUser) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: status div for auth loading/prompt state
    <div
      className="flex flex-1 flex-col items-center justify-center gap-4"
      role="status"
    >
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <p
            className="text-center text-muted-foreground text-sm"
            id="login-prompt"
          >
            {promptText}
          </p>
          <Button
            aria-describedby="login-prompt"
            onClick={loginWithGithub}
            variant="outline"
          >
            <Image
              alt="GitHub logo"
              className="mr-2"
              height={16}
              src={`/images/${resolvedTheme === "light" ? "octocat" : "octocat-white"}.svg`}
              width={16}
            />
            Connect to GitHub
          </Button>
        </>
      )}
    </div>
  );
};
