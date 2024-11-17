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

import { AboutButton } from '@/components/about-button';
import { RoomAccessForm } from '@/components/room-access-form';
import { ThemeSwitch } from '@/components/theme-switch';

export default function Page() {
  return (
    <main
      className="flex h-full items-center justify-center p-2"
      aria-label="Join or create a room"
    >
      <RoomAccessForm />
      <ThemeSwitch />
      <AboutButton />
    </main>
  );
}
