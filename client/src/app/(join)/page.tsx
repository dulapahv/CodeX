import { Suspense } from 'react';

import { JoinForm } from '@/components/join-form';

export default function Home() {
  return (
    <Suspense>
      <main className="flex h-full items-center justify-center p-2">
        <JoinForm />
      </main>
    </Suspense>
  );
}
