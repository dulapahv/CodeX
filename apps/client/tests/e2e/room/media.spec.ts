/**
 * End-to-end tests for video calls over the Realtime SFU.
 * Runs only with E2E_SFU=1 and SFU credentials in apps/server/.dev.vars.
 * Tests:
 * - A camera reaching another user, after toggling and after rejoining
 * - A microphone reaching another user
 * - Sharing a screen into the other user's preview panel
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import {
  type Browser,
  expect,
  type Locator,
  type Page,
  test,
} from "@playwright/test";

import { createRoom, joinRoom } from "@/tests/utils/setup";

test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  },
});

// Headless Chromium never resolves getDisplayMedia, so the "screen" is the
// fake camera's test pattern
const fakeScreenCapture = () => {
  navigator.mediaDevices.getDisplayMedia = () =>
    navigator.mediaDevices.getUserMedia({ video: true });
};

const openPage = async (browser: Browser) => {
  const context = await browser.newContext({
    permissions: ["camera", "microphone"],
  });
  await context.addInitScript(fakeScreenCapture);
  return context.newPage();
};

const openTwoUsers = async (browser: Browser) => {
  const userAPage = await openPage(browser);
  const userBPage = await openPage(browser);

  const roomUrl = await createRoom(userAPage, "User A");
  await joinRoom(userBPage, roomUrl, "User B");
  return { roomUrl, userAPage, userBPage };
};

// User B's own camera stays off, so the only video in their panel is the
// other user's
const remoteVideos = (page: Page) =>
  page.getByRole("region", { name: "Webcam Stream" }).locator("video");

const expectPlaying = (video: Locator) =>
  expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.videoWidth)
    )
    .toBeGreaterThan(0);

// Loudest moment of the call audio over 3 seconds; the fake mic beeps
const peakCallVolume = (page: Page) =>
  page.evaluate(async () => {
    const audio = document.querySelector("audio");
    const stream = audio?.srcObject;
    // Polled again until the call's audio is attached
    if (
      !(stream instanceof MediaStream) ||
      stream.getAudioTracks().length === 0
    ) {
      return 0;
    }
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Float32Array(analyser.fftSize);
    let peak = 0;
    for (let i = 0; i < 30; i++) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      analyser.getFloatTimeDomainData(samples);
      const power =
        samples.reduce((sum, sample) => sum + sample * sample, 0) /
        samples.length;
      peak = Math.max(peak, Math.sqrt(power));
    }
    await context.close();
    return peak;
  });

test.describe("Video Calls", () => {
  test("should show a camera to another user, also after turning it off and on", async ({
    browser,
  }) => {
    const { userAPage, userBPage } = await openTwoUsers(browser);
    const cameraButton = userAPage.getByLabel("Toggle camera");

    await cameraButton.click();
    await expect(remoteVideos(userBPage)).toHaveCount(1);
    await expectPlaying(remoteVideos(userBPage));

    await cameraButton.click();
    await expect(remoteVideos(userBPage)).toHaveCount(0);

    await cameraButton.click();
    await expect(remoteVideos(userBPage)).toHaveCount(1);
    await expectPlaying(remoteVideos(userBPage));
  });

  test("should show a camera from someone who left and rejoined", async ({
    browser,
  }) => {
    const { roomUrl, userAPage, userBPage } = await openTwoUsers(browser);
    await userAPage.getByLabel("Toggle camera").click();
    await expectPlaying(remoteVideos(userBPage));

    await userAPage.context().close();
    await expect(remoteVideos(userBPage)).toHaveCount(0);

    const returningPage = await openPage(browser);
    await joinRoom(returningPage, roomUrl, "User A");
    await returningPage.getByLabel("Toggle camera").click();

    await expect(remoteVideos(userBPage)).toHaveCount(1);
    await expectPlaying(remoteVideos(userBPage));
  });

  test("should play a microphone to another user", async ({ browser }) => {
    const { userAPage, userBPage } = await openTwoUsers(browser);

    await userAPage.getByLabel("Toggle microphone").click();

    await expect.poll(() => peakCallVolume(userBPage)).toBeGreaterThan(0.05);
  });

  test("should share a screen into the other user's preview panel", async ({
    browser,
  }) => {
    const { userAPage, userBPage } = await openTwoUsers(browser);
    const screenTab = userBPage.getByRole("tab", { name: "User A's screen" });
    const sharedScreen = userBPage.getByRole("tabpanel").locator("video");

    await userAPage.getByLabel("Share screen").click();

    await expect(screenTab).toHaveAttribute("aria-selected", "true");
    await expectPlaying(sharedScreen);
    await expect(
      userAPage.getByText("You're sharing your screen")
    ).toBeVisible();

    // Switching tabs must not drop the share
    await userBPage.getByRole("tab", { name: "Live Preview" }).click();
    await screenTab.click();
    await expectPlaying(sharedScreen);

    await userAPage
      .getByRole("button", { name: "Stop sharing", exact: true })
      .click();

    await expect(screenTab).toBeHidden();
  });
});
