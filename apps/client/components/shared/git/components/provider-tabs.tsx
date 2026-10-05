/**
 * Provider switcher at the top of the repository dialogs.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  isProviderId,
  PROVIDER_IDS,
  PROVIDER_LABELS,
  type ProviderId,
} from "@/lib/git-providers/types";

import { ProviderLogo } from "./provider-logo";

interface ProviderTabsProps {
  children: ReactNode;
  onValueChange: (provider: ProviderId) => void;
  value: ProviderId;
}

export const ProviderTabs = ({
  children,
  onValueChange,
  value,
}: ProviderTabsProps) => (
  <Tabs
    className="min-h-0 flex-1"
    onValueChange={(next) => {
      if (typeof next === "string" && isProviderId(next)) {
        onValueChange(next);
      }
    }}
    value={value}
  >
    <TabsList aria-label="Git provider" className="mx-4 w-auto md:mx-0">
      {PROVIDER_IDS.map((provider) => (
        <TabsTrigger
          aria-label={PROVIDER_LABELS[provider]}
          key={provider}
          value={provider}
        >
          <ProviderLogo provider={provider} />
          <span className="hidden sm:inline">{PROVIDER_LABELS[provider]}</span>
        </TabsTrigger>
      ))}
    </TabsList>
    <TabsContent className="flex min-h-0 flex-col gap-4" value={value}>
      {children}
    </TabsContent>
  </Tabs>
);
