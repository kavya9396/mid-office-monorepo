import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { GuwDrsPage } from "../guw/GuwDrsPage";

/**
 * Dispatches to the correct DRS page based on the `roleType` query param
 * passed by the inbox on row click.
 *
 *  DVT_POOL / GOPS_DVT / DVT_FORMAL  →  DvtUser
 *  GUW (no memberId)                 →  redirect to /guw/member-selection
 *  GUW (with memberId)               →  GuwUser   (after member is selected)
 *  GUW_FORMAL or unknown             →  GuwDrsPage
 */
const DVT_ROLE_TYPES = new Set(["DVT_POOL", "GOPS_DVT", "DVT_FORMAL"]);

export default function GroupDrsRouter() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roleType = params.get("roleType")?.trim().toUpperCase() ?? "";
  const memberId = params.get("memberId")?.trim() ?? "";

  useEffect(() => {
    if (roleType === "GUW" && memberId === "") {
      // No member selected yet — go to member selection page, preserving all params.
      navigate(`/guw/member-selection?${params.toString()}`, { replace: true });
    }
  }, [roleType, memberId, navigate, params]);

  if (DVT_ROLE_TYPES.has(roleType)) {
    return <DvtUser />;
  }

  if (roleType === "GUW" && memberId !== "") {
    return <GuwUser />;
  }

  // While redirect for GUW (no memberId) is pending, render nothing.
  if (roleType === "GUW") {
    return null;
  }

  // GUW_FORMAL or unknown — fall back to GUW Formal page
  return <GuwDrsPage />;
}
