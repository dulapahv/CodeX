/**
 * Settings section listing each git provider with its connect/disconnect
 * action.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { PlugsIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useState } from "react";

import { ProviderLogo } from "@/components/shared/git/components/provider-logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type GitConnection,
  useGitConnections,
} from "@/hooks/use-git-connections";
import {
  PROVIDER_IDS,
  PROVIDER_LABELS,
  type ProviderId,
} from "@/lib/git-providers/types";

interface ConnectionRowProps {
  connection: GitConnection | undefined;
  onConnect: () => void;
  onDisconnect: () => void;
  provider: ProviderId;
}

const ConnectionAction = ({
  connection,
  onConnect,
  onDisconnect,
  provider,
}: ConnectionRowProps) => {
  const label = PROVIDER_LABELS[provider];

  if (!connection) {
    return (
      <Skeleton
        aria-label={`Checking ${label} connection`}
        className="h-7 w-20"
        role="status"
      />
    );
  }
  if (!connection.configured) {
    return (
      <Button disabled size="sm" variant="outline">
        Not available
      </Button>
    );
  }
  if (connection.user) {
    return (
      <Button
        aria-label={`Disconnect from ${label}`}
        onClick={onDisconnect}
        size="sm"
        variant="destructive"
      >
        <PlugsIcon aria-hidden="true" />
        Disconnect
      </Button>
    );
  }
  return (
    <Button
      aria-label={`Connect to ${label}`}
      onClick={onConnect}
      size="sm"
      variant="outline"
    >
      Connect
    </Button>
  );
};

const ConnectionRow = (props: ConnectionRowProps) => {
  const { connection, provider } = props;
  const user = connection?.user;
  const [hasAvatar, setHasAvatar] = useState(true);

  return (
    <li className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <ProviderLogo className="size-5" provider={provider} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{PROVIDER_LABELS[provider]}</p>
          <div className="text-muted-foreground flex h-4 items-center gap-1.5 text-xs">
            {!connection && <Skeleton className="h-3 w-24" />}
            {connection && !user && "Not connected"}
            {user?.avatarUrl && hasAvatar && (
              <Image
                alt=""
                className="rounded-full"
                height={16}
                onError={() => setHasAvatar(false)}
                src={user.avatarUrl}
                width={16}
              />
            )}
            {user && <span className="truncate">{user.username}</span>}
          </div>
        </div>
      </div>
      <ConnectionAction {...props} />
    </li>
  );
};

export const RepositoryConnections = ({ isOpen }: { isOpen: boolean }) => {
  const { connections, connect, disconnect } = useGitConnections(isOpen);

  return (
    <ul aria-label="Repository connections" className="flex flex-col gap-3">
      {PROVIDER_IDS.map((provider) => (
        <ConnectionRow
          connection={connections[provider]}
          key={provider}
          onConnect={() => connect(provider)}
          onDisconnect={() => disconnect(provider)}
          provider={provider}
        />
      ))}
    </ul>
  );
};
