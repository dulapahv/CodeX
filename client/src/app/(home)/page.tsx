import Image from 'next/image';

import { AboutButton } from '@/components/about-button';
import { AnimatedGridBackground } from '@/components/animated-grid-bg';
import { RoomAccessForm } from '@/components/room-access-form';
import { ShowcaseGrid } from '@/components/showcase-grid';

const Page = () => (
  <>
    <div
      aria-hidden="true"
      role="presentation"
      className="fixed inset-0 -z-10 bg-[#111623]"
    />
    <div
      aria-hidden="true"
      role="presentation"
      className="fixed inset-0 -z-10 bg-gradient-to-tr from-[#fb568a]/50 via-[#c240ff]/50 to-[#3b77fd]/50 to-90%"
    />
    <div className="dark fixed inset-0 -z-10">
      <AnimatedGridBackground />
    </div>
    <main className="dark relative flex min-h-full w-full flex-col overflow-hidden min-[1189px]:flex-row">
      {/* Left Section - Form */}
      <div className="flex min-h-[700px] w-full flex-col justify-center p-4 min-[560px]:p-8 min-[1189px]:h-dvh min-[1189px]:w-5/12 min-[1189px]:items-center">
        <div className="w-full max-w-xl">
          <div className="mb-6">
            <div className="space-y-6">
              <h1 className="flex flex-row items-start gap-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                <Image
                  src="/images/kasca-logo.svg"
                  alt="Kasca Logo"
                  width={96}
                  height={96}
                  className="size-20 min-[1189px]:size-24"
                  priority
                />
                <div className="flex flex-col items-start text-start">
                  <span>Code together</span>
                  <span className="flex items-end gap-2 min-[1189px]:items-baseline">
                    <span>now on</span>
                    <span className="bg-gradient-to-r from-[#fb568a] to-[#e456fb] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                      Kasca
                    </span>
                  </span>
                </div>
              </h1>
              <p className="text-lg text-foreground/90 sm:text-xl">
                Your collaborative coding space, reimagined. Start now,
                <br />
                no sign-up required.
              </p>
            </div>
          </div>
          <RoomAccessForm />
        </div>
      </div>

      {/* Right Section - Showcase Grid */}
      <div className="dark relative flex w-full flex-1 items-center justify-center overflow-y-auto min-[1189px]:w-7/12 min-[1189px]:pr-8">
        <ShowcaseGrid />
      </div>

      <div className="dark">
        <AboutButton />
      </div>
    </main>
  </>
);

export default Page;
