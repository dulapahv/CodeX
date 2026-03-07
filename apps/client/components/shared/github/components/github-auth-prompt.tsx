/**
 * GitHub authentication prompt component.
 * Displays login button or loading spinner based on auth state.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from 'next/image';

import { useTheme } from 'next-themes';

import { loginWithGithub } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';

interface GithubAuthPromptProps {
  isLoading: boolean;
  githubUser: string | null;
  promptText?: string;
}

export const GithubAuthPrompt = ({
  isLoading,
  githubUser,
  promptText = 'Please connect to GitHub to continue.'
}: GithubAuthPromptProps) => {
  const { resolvedTheme } = useTheme();

  if (githubUser) return null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4" role="status">
      {isLoading ? (
        <Spinner size="lg" />
      ) : (
        <>
          <p className="text-muted-foreground text-center text-sm" id="login-prompt">
            {promptText}
          </p>
          <Button onClick={loginWithGithub} variant="outline" aria-describedby="login-prompt">
            <Image
              src={`/images/${resolvedTheme === 'light' ? 'octocat' : 'octocat-white'}.svg`}
              alt="GitHub logo"
              className="mr-2"
              width={16}
              height={16}
            />
            Connect to GitHub
          </Button>
        </>
      )}
    </div>
  );
};
