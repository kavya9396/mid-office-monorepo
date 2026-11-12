import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { QuickLinkItem } from "@insurance-poc/common/quick-links";
import { fetchGuwDrs } from "../../services/guwService";
import { fetchGroupDrs } from "../../services/drsService";
import type { QuickLinksSubSections } from "./quickLinksData";

// Quick links that have their own page route (opened as a new page; Header back returns to the DRS)
const PAGE_LINK_IDS = new Set(["previous-policies", "open-tasks", "risk-details", "audit-trail"]);

// DVT screens use their own data; every other Group screen reads the GUW DRS payload
const DVT_ROLE_TYPES = new Set(["DVT_POOL", "GOPS_DVT", "DVT_FORMAL", "DVT_TASK", "DVT USER", "DVT"]);

const isDvtRole = (roleType: string) =>
  DVT_ROLE_TYPES.has(roleType.toUpperCase()) || roleType.toUpperCase().includes("DVT");

/** Links with a page route navigate (no `onClick`); the others only show a message. */
export function buildQuickLinkItems(
  items: ReadonlyArray<QuickLinkItem>,
  notify: (message: string) => void,
): QuickLinkItem[] {
  return items.map((link) =>
    link.id && PAGE_LINK_IDS.has(link.id)
      ? { ...link }
      : { ...link, onClick: () => notify(`Navigating to ${link.label}`) },
  );
}

export interface GuwQuickLinksState {
  loading: boolean;
  /** `undefined` => the page keeps its built-in data. */
  data?: QuickLinksSubSections;
}

/** Loads the DRS `subSections` for the Quick Link pages (`applicationNo` comes from the URL). */
export function useGuwQuickLinks(): GuwQuickLinksState {
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const memberId = params.get("memberId")?.trim() ?? "";
  const roleType = (params.get("roleType") || params.get("role") || "").trim().toUpperCase();
  const shouldLoad = applicationNo !== "";
  const [state, setState] = useState<GuwQuickLinksState>({ loading: shouldLoad });

  useEffect(() => {
    if (!shouldLoad) {
      setState({ loading: false });
      return;
    }
    let active = true;
    setState({ loading: true });

    const fetcher = isDvtRole(roleType)
      ? fetchGroupDrs(applicationNo)
      : fetchGuwDrs(applicationNo, memberId);

    void fetcher.then((record) => {
      if (active) setState({ loading: false, data: record?.quickLinks });
    });
    return () => {
      active = false;
    };
  }, [applicationNo, memberId, roleType, shouldLoad]);

  return state;
}

export const useGroupQuickLinks = useGuwQuickLinks;
