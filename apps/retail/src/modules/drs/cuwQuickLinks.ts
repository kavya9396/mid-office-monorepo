import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { QuickLinkItem } from "@insurance-poc/common/quick-links";
import { getDrsApplicationNo, getDrsMemberId, getDrsRoleType } from "@insurance-poc/utils";
import { fetchCuwDrs } from "../../services/drsService";
import type { QuickLinksSubSections } from "./quickLinksData";

// Quick links that have their own page route (opened as a new page; Header back returns to the DRS)
const PAGE_LINK_IDS = new Set(["previous-policies", "open-tasks", "risk-details", "audit-trail"]);

// Only CUW / HOD / Sr UW read the CUW DRS payload; CVT and the other Retail screens keep their built-in data.
const CUW_ROLE_TYPES = new Set(["CUW_TASK", "CUW", "HOD_TASK", "HOD", "SR_UW_TASK", "SR_UW"]);

const isCuwRole = (roleType: string) => CUW_ROLE_TYPES.has(roleType.toUpperCase());

/**
 * Links with a page route navigate (no `onClick`); the others only show a message.
 * `dialogLinkIds` are handled by QuickLinksModule `dialogItemIds`, so they also get no `onClick`.
 */
export function buildQuickLinkItems(
  items: ReadonlyArray<QuickLinkItem>,
  notify: (message: string) => void,
  dialogLinkIds: ReadonlyArray<string> = [],
): QuickLinkItem[] {
  return items.map((link) =>
    link.href || (link.id && (PAGE_LINK_IDS.has(link.id) || dialogLinkIds.includes(link.id)))
      ? { ...link }
      : { ...link, onClick: () => notify(`Navigating to ${link.label}`) },
  );
}

/** Makes "Proposal Form & Documents" open `link` in a new tab; without a link it keeps the notify message. */
export function withProposalFormLink(
  items: ReadonlyArray<QuickLinkItem>,
  link: string | undefined,
): QuickLinkItem[] {
  return items.map((item) =>
    item.id === "proposal-documents" && link ? { ...item, href: link, target: "_blank" } : item,
  );
}

export interface CuwQuickLinksState {
  loading: boolean;
  /** `undefined` => the page keeps its built-in data. */
  data?: QuickLinksSubSections;
}

/** Loads the DRS `subSections` for the Quick Link pages (`applicationNo` from route or session). */
export function useCuwQuickLinks(): CuwQuickLinksState {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() || getDrsApplicationNo();
  const memberId = getDrsMemberId();
  const roleType = getDrsRoleType().trim().toUpperCase();
  const shouldLoad = applicationNo.length > 0 && isCuwRole(roleType);
  const [state, setState] = useState<CuwQuickLinksState>({ loading: shouldLoad });

  useEffect(() => {
    if (!shouldLoad) {
      setState({ loading: false });
      return;
    }
    let active = true;
    setState({ loading: true });

    void fetchCuwDrs(applicationNo, memberId, roleType).then((record) => {
      if (active) setState({ loading: false, data: record?.quickLinks });
    });
    return () => {
      active = false;
    };
  }, [applicationNo, memberId, roleType, shouldLoad]);

  return state;
}

export const useRetailQuickLinks = useCuwQuickLinks;