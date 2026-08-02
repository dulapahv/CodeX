/**
 * OpenNext adapter configuration for deploying to Cloudflare Workers.
 *
 * This app has no ISR: there is no `export const revalidate`, no `revalidateTag`
 * / `revalidatePath`, and no `"use cache"`. Every route is either fully static
 * (prerendered at build time) or fully dynamic (SSR / route handler).
 *
 * Because nothing is ever revalidated at runtime, the incremental cache only
 * ever needs to *read* build-time values. The Workers Static Assets cache does
 * exactly that with zero bindings and zero per-request I/O, and is the fastest
 * option per https://opennext.js.org/cloudflare/perf.
 *
 * If ISR is introduced later, switch back to R2 (wrapped in `withRegionalCache`)
 * plus a queue and tag cache, and restore the `NEXT_INC_CACHE_R2_BUCKET` and
 * `WORKER_SELF_REFERENCE` bindings in wrangler.jsonc.
 * See https://opennext.js.org/cloudflare/caching.
 */

import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
  // Serve cached SSG routes straight from the incremental cache, skipping the
  // Next.js server on cache hits. Not compatible with PPR (not used here).
  enableCacheInterception: true,
});
