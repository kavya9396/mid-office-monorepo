import { useState, useCallback } from "react";
import { QuickLinks, type QuickLinkItem, type QuickLinksProps } from "../../components/QuickLinks";
import { PreviousPolicyDialog } from "../../components/PreviousPolicy";

export interface QuickLinksModuleProps extends Partial<QuickLinksProps> {
  items: QuickLinkItem[];
  applicationNo?: string;
  previousPolicyMode?: "page" | "modal";
  roleType?: string;
  onNavigate?: (path: string) => void;
  onNotify?: (message: string) => void;
}

export const QuickLinksModule = ({
  items,
  applicationNo,
  previousPolicyMode = "modal",
  roleType,
  onNavigate,
  onNotify,
  ...quickLinksProps
}: Readonly<QuickLinksModuleProps>) => {
  const [previousPolicyOpen, setPreviousPolicyOpen] = useState(false);

  const handleItemClick = useCallback(
    (item: QuickLinkItem, index: number) => {
      quickLinksProps.onItemClick?.(item, index);

      if (item.onClick) {
        return;
      }

      if (item.id === "previous-policies" || item.id === "previous-policy") {
        if (previousPolicyMode === "modal") {
          setPreviousPolicyOpen(true);
        } else if (onNavigate) {
          const appParam = applicationNo ? `?applicationNo=${encodeURIComponent(applicationNo)}` : "";
          onNavigate(`/previous-policy${appParam}`);
        }
      } else if (onNotify) {
        onNotify(`Navigating to ${item.label}`);
      }
    },
    [applicationNo, onNavigate, onNotify, previousPolicyMode, quickLinksProps]
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
    </>
  );
};

export default QuickLinksModule;
