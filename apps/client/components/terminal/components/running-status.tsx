/**
 * Shows who is running code right now, from everyone's presence, so people
 * who join mid-run see it too.
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { Spinner } from "@/components/ui/spinner";
import {
  usePresenceSelector,
  useRoomConnection,
} from "@/lib/realtime/room-context";

const isSameNames = (previous: string[], next: string[]) =>
  previous.length === next.length &&
  previous.every((name, index) => name === next[index]);

export const useRunningNames = () => {
  const clientId = useRoomConnection()?.clientId;
  return usePresenceSelector(
    (states) =>
      [...states]
        .filter(([, state]) => state?.running)
        .map(([id, state]) =>
          id === clientId ? "You" : (state.user?.name ?? "Someone")
        ),
    isSameNames
  );
};

const describeRunners = (names: string[]) => {
  if (names.length === 1) {
    return names[0] === "You" ? "You are" : `${names[0]} is`;
  }
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are`;
};

export const RunningStatus = ({ names }: { names: string[] }) => (
  <div
    className="text-muted-foreground flex items-center gap-2 text-xs"
    role="status"
  >
    <Spinner className="size-3" />
    {describeRunners(names)} running code
  </div>
);
