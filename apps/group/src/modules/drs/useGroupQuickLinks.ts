import { useSearchParams } from "react-router-dom";
import { useGetGroupDrsQuery } from "../../services/drsApi";
import type { QuickLinksSubSections } from "./quickLinksData";

/**
 * DRS `membersDetails[].subSections` for the Quick Link pages.
 * `applicationNo` comes from the query string (the quick links add it); `data` is `undefined`
 * until loaded, so a page keeps its built-in data meanwhile.
 */
export function useGroupQuickLinks(): { data?: QuickLinksSubSections } {
  const [params] = useSearchParams();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const drs = useGetGroupDrsQuery(applicationNo, { skip: applicationNo.length === 0 });
  return { data: drs.data?.quickLinks };
}
