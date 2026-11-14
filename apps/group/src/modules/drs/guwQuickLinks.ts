import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { QuickLinkItem } from "@insurance-poc/common/quick-links";
import { getDrsApplicationNo, getDrsMemberId, getDrsRoleType } from "@insurance-poc/utils";
import { fetchGuwDrs } from "../../services/guwService";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import type { QuickLinksSubSections } from "./quickLinksData";

// Quick links that have their own page route (opened as a new page; Header back returns to the DRS)
const PAGE_LINK_IDS = new Set(["previous-policies", "open-tasks", "risk-details", "audit-trail"]);

// DVT screens use their own data; every other Group screen reads the GUW DRS payload
const DVT_ROLE_TYPES = new Set(["DVT_POOL", "GOPS_DVT", "DVT_FORMAL", "DVT_TASK", "DVT USER", "DVT"]);

const isDvtRole = (roleType: string) =>
  DVT_ROLE_TYPES.has(roleType.toUpperCase()) || roleType.toUpperCase().includes("DVT");

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

export interface GuwQuickLinksState {
  loading: boolean;
  /** `undefined` => the page keeps its built-in data. */
  data?: QuickLinksSubSections;
}

/** Loads the DRS `subSections` for the Quick Link pages (`applicationNo` from route or session). */
export function useGuwQuickLinks(): GuwQuickLinksState {
  const { applicationNo: applicationNoParam } = useParams();
  const applicationNo = applicationNoParam?.trim() || getDrsApplicationNo();
  const memberId = getDrsMemberId();
  const roleType = getDrsRoleType().trim().toUpperCase();
  const shouldLoad = applicationNo.length > 0;
  const isDvt = isDvtRole(roleType);
  const [state, setState] = useState<GuwQuickLinksState>({ loading: shouldLoad });
  const dvt = useGetGroupDrsQuery(applicationNo, { skip: !shouldLoad || !isDvt });

  useEffect(() => {
    if (!shouldLoad || isDvt) {
      setState({ loading: false });
      return;
    }
    let active = true;
    setState({ loading: true });

    void fetchGuwDrs(applicationNo, memberId).then((record) => {
      if (active) setState({ loading: false, data: record?.quickLinks });
    });
    return () => {
      active = false;
    };
  }, [applicationNo, memberId, isDvt, shouldLoad]);

  if (shouldLoad && isDvt) {
    return { loading: dvt.isLoading || dvt.isFetching, data: dvt.data?.quickLinks };
  }
  return state;
}

export const useGroupQuickLinks = useGuwQuickLinks;