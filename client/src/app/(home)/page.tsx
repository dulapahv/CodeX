/**
 * Root page component that renders the join form.
 * Wraps the form in a Suspense boundary to handle loading states.
 *
 * @remarks
 * - Uses React Suspense for loading state handling
 * - Centers content both horizontally and vertically in the viewport
 * - Provides padding around the form component
 *
 * Created by Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Suspense } from 'react';

import { JoinForm } from '@/components/join-form';

export default function Page() {
  return (
    <Suspense>
      <main className="flex h-full items-center justify-center p-2">
        <JoinForm />
      </main>
    </Suspense>
  );
}
