import { useState, useCallback } from "react";
import { QuickLinks, type QuickLinkItem, type QuickLinksProps } from "../../components/QuickLinks";
import { PreviousPolicyDialog } from "../../components/PreviousPolicy";
import { OpenTasksDialog, type OpenTaskItem } from "../../components/OpenTasks";

export interface QuickLinksModuleProps extends Partial<QuickLinksProps> {
  items: QuickLinkItem[];
  applicationNo?: string;
  previousPolicyMode?: "page" | "modal";
  openTasksMode?: "page" | "modal";
  openTasks?: OpenTaskItem[];
  roleType?: string;
  onNavigate?: (path: string) => void;
  onNotify?: (message: string) => void;
}

export const QuickLinksModule = ({
  items,
  applicationNo,
  previousPolicyMode = "page",
  openTasksMode = "page",
  openTasks,
  roleType,
  onNavigate,
  onNotify,
  ...quickLinksProps
}: Readonly<QuickLinksModuleProps>) => {
  const [previousPolicyOpen, setPreviousPolicyOpen] = useState(false);
  const [openTasksOpen, setOpenTasksOpen] = useState(false);

  const handleItemClick = useCallback(
    (item: QuickLinkItem, index: number) => {
      quickLinksProps.onItemClick?.(item, index);

      if (item.onClick) {
        return;
      }

      const searchParams = new URLSearchParams(window.location.search);
      if (applicationNo) {
        searchParams.set("applicationNo", applicationNo);
      }
      if (roleType && !searchParams.has("role")) {
        searchParams.set("role", roleType);
      }
      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

      if (item.id === "previous-policies" || item.id === "previous-policy") {
        if (previousPolicyMode === "modal") {
          setPreviousPolicyOpen(true);
        } else if (onNavigate) {
          onNavigate(`/previous-policy${queryString}`);
        }
      } else if (item.id === "open-tasks" || item.id === "open-task") {
        if (openTasksMode === "modal") {
          setOpenTasksOpen(true);
        } else if (onNavigate) {
          onNavigate(`/open-tasks${queryString}`);
        }
      } else if (item.id === "audit-trail" || item.id === "audit") {
        if (onNavigate) {
          onNavigate(`/audit-trail${queryString}`);
        }
      } else if (onNotify) {
        onNotify(`Navigating to ${item.label}`);
      }
    },
    [applicationNo, onNavigate, onNotify, openTasksMode, previousPolicyMode, quickLinksProps, roleType]
  );

  return (
    <>
      <QuickLinks
        items={items}
        onItemClick={handleItemClick}
        {...quickLinksProps}
      />

      <PreviousPolicyDialog
        open={previousPolicyOpen}
        onClose={() => setPreviousPolicyOpen(false)}
        roleType={roleType}
      />

      <OpenTasksDialog
        open={openTasksOpen}
        onClose={() => setOpenTasksOpen(false)}
        tasks={openTasks}
      />
    </>
  );
};

export default QuickLinksModule;
