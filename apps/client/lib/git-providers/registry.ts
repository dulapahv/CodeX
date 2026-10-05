/**
 * Looks up the adapter for a provider ID.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { bitbucket } from "./bitbucket";
import { codeberg } from "./codeberg";
import { github } from "./github";
import { gitlab } from "./gitlab";
import type { GitProvider } from "./provider";
import type { ProviderId } from "./types";

const PROVIDERS: Record<ProviderId, GitProvider> = {
  github,
  gitlab,
  bitbucket,
  codeberg,
};

export const getProvider = (id: ProviderId): GitProvider => PROVIDERS[id];
