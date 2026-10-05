/**
 * Settings section listing each git provider with its connect/disconnect
 * action.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Unplug } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { ProviderLogo } from "@/components/shared/git/components/provider-logo";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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
  isLoading: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  provider: ProviderId;
}

const ConnectionAction = ({
  connection,
  isLoading,
  onConnect,
  onDisconnect,
  provider,
}: ConnectionRowProps) => {
  const label = PROVIDER_LABELS[provider];

  if (isLoading) {
    return <Spinner aria-label={`Checking ${label} connection`} />;
  }
  if (!connection?.configured) {
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
        <Unplug aria-hidden="true" />
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
          <p className="font-medium text-sm">{PROVIDER_LABELS[provider]}</p>
          {user && (
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              {user.avatarUrl && hasAvatar && (
                <Image
                  alt=""
                  className="rounded-full"
                  height={16}
                  onError={() => setHasAvatar(false)}
                  src={user.avatarUrl}
                  width={16}
                />
              )}
              <span className="truncate">{user.username}</span>
            </p>
          )}
        </div>
      </div>
      <ConnectionAction {...props} />
    </li>
  );
};

export const RepositoryConnections = ({ isOpen }: { isOpen: boolean }) => {
  const { connections, isLoading, connect, disconnect } =
    useGitConnections(isOpen);

  return (
    <ul aria-label="Repository connections" className="flex flex-col gap-3">
      {PROVIDER_IDS.map((provider) => (
        <ConnectionRow
          connection={connections?.[provider]}
          isLoading={isLoading}
          key={provider}
          onConnect={() => connect(provider)}
          onDisconnect={() => disconnect(provider)}
          provider={provider}
        />
      ))}
    </ul>
  );
};
