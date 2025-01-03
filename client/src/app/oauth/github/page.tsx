/**
 * OAuth callback page component that handles GitHub authentication response.
 * This page receives authentication status via query parameters and
 * communicates the result back to the parent window that initiated the
 * OAuth flow.
 *
 * @remarks
 * This is a client-side component that uses the window.postMessage API to
 * communicate with its parent window. When mounted, it checks if it was opened
 * in a popup window (window.opener exists) and sends the authentication result
 * back to the parent.
 *
 * The component is used as part of the GitHub OAuth flow to handle the callback
 * after authentication attempt.
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

'use client';

import { useEffect } from 'react';
import type { Metadata } from 'next';
import { useSearchParams } from 'next/navigation';
import { LoaderCircle } from 'lucide-react';

import { GITHUB_OAUTH_DESCRIPTION, GITHUB_OAUTH_TITLE } from '@/lib/constants';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: GITHUB_OAUTH_TITLE,
  description: GITHUB_OAUTH_DESCRIPTION,
};

export default function Page() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const isSuccessful = status === 'success';

  useEffect(() => {
    if (window.opener) {
      // Send message to parent window
      window.opener.postMessage(
        {
          type: 'github-oauth',
          success: isSuccessful,
        },
        '*',
      );
    }
  }, [isSuccessful]);

  return (
    <main className="fixed left-0 top-0 flex size-full items-center justify-center p-2">
      <Alert className="max-w-md bg-background/50 backdrop-blur">
        <LoaderCircle className="size-5 animate-spin" />
        <AlertTitle>Processing authentication...</AlertTitle>
        <AlertDescription>
          This window will close automatically in a few seconds.
        </AlertDescription>
      </Alert>
    </main>
  );
}
