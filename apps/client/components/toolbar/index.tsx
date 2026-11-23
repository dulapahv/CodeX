/**
 * The title bar's menus, which run the workbench's commands.
 * Features:
 * - Desktop menubar and a single mobile menu
 * - Placeholder while the editor loads
 *
 * By Dulapah Vibulsanti (https://dulapahv.dev)
 */

import { useWorkbench } from "@/components/workbench/workbench-provider";
import { useMediaQuery } from "@/hooks/use-media-query";

import { DesktopMenu } from "./components/desktop-menu";
import { MobileMenu } from "./components/mobile-menu";
import { ToolbarSkeleton } from "./components/toolbar-skeleton";

const Toolbar = () => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { actions, layout, platform } = useWorkbench();

  if (!actions) {
    return <ToolbarSkeleton />;
  }

  return isDesktop ? (
    <DesktopMenu actions={actions} layout={layout} platform={platform} />
  ) : (
    <MobileMenu actions={actions} layout={layout} platform={platform} />
  );
};

export { Toolbar };
