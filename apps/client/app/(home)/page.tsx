/**
 * Home page component that displays the landing page with:
 * - Room access form
 * - Animated background
 * - Feature showcase grid
 * - About and latency test buttons
 * - Server status indicator
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import Image from "next/image";
import { Suspense } from "react";

import { AboutButton } from "@/components/about-button";
import { AnimatedGridBackground } from "@/components/animated-grid-bg";
import { LatencyTestButton } from "@/components/latency-test-button";
import { RoomAccessForm } from "@/components/room-access-form";
import { ShowcaseGrid } from "@/components/showcase-grid";
import { Status } from "@/components/status";

export default async function Page({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const roomId = params.room?.toString() || "";

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-[#111623]"
        role="presentation"
      />
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-tr from-[#fb568a]/50 via-[#c240ff]/50 to-90% to-[#3b77fd]/50"
        role="presentation"
      />
      <div className="dark fixed inset-0 -z-10">
        <AnimatedGridBackground />
      </div>
      <main className="dark relative flex min-h-full w-full flex-col overflow-hidden min-[1189px]:flex-row">
        {/* Left Section - Form */}
        <div className="my-2 flex min-h-[700px] w-full flex-col justify-center p-4 min-[1189px]:w-5/12 min-[1189px]:items-center min-[560px]:p-8">
          <div className="w-full max-w-xl">
            <div className="mb-6 space-y-6">
              <h1 className="flex flex-row items-start gap-2 font-bold text-4xl text-foreground tracking-tight sm:text-5xl">
                <Image
                  alt="CodeX Logo"
                  className="size-20 min-[1189px]:size-24"
                  fetchPriority="high"
                  height={96}
                  loading="eager"
                  src="/images/codex-logo.svg"
                  width={96}
                />
                <div className="flex flex-col items-start text-start">
                  <span>Code together</span>
                  <span className="flex items-end gap-2 min-[1189px]:items-baseline">
                    <span>now on</span>
                    <span className="bg-gradient-to-r from-[#fb568a] to-[#e456fb] bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
                      CodeX
                    </span>
                  </span>
                </div>
              </h1>
              <p className="w-full whitespace-pre-line text-foreground/90 text-lg sm:w-[93%] sm:text-xl">
                Your collaborative coding space, reimagined. Start now, no
                sign-up required.
              </p>
            </div>

            <Suspense fallback={null}>
              <RoomAccessForm roomId={roomId} />
            </Suspense>
          </div>
        </div>

        {/* Right Section - Showcase Grid */}
        <div className="dark relative flex w-full max-w-5xl flex-1 items-center justify-center min-[1189px]:w-7/12 min-[1189px]:pr-8">
          <ShowcaseGrid />
        </div>

        <div className="dark fixed right-3 bottom-2.5 flex items-center gap-x-3">
          <Status />
          <LatencyTestButton />
          <AboutButton />
        </div>
      </main>
    </>
  );
}
