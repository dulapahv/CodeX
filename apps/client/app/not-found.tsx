/**
 * 404 page component displayed when a route is not found.
 * Features:
 * - Error message display
 * - Return to home button
 * - Responsive layout
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { HouseIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { BASE_CLIENT_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Alert className="max-w-lg">
        <AlertTitle className="text-xl font-semibold">
          404 - Page Not Found
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. Please
          check the URL or navigate back to the homepage.
        </AlertDescription>
        <div className="mt-6 flex justify-end">
          <Link
            className={cn(
              buttonVariants({ className: "gap-2", variant: "default" })
            )}
            href={BASE_CLIENT_URL}
          >
            <HouseIcon className="size-4" />
            Return Home
          </Link>
        </div>
      </Alert>
    </div>
  );
}
