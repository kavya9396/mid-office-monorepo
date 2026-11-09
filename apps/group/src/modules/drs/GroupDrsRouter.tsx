import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MmtGrievanceDrsPage } from "../mmt-grievance/MmtGrievanceDrsPage";
import { TpaDrsPage } from "../tpa/TpaDrsPage";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { GuwDrsPage } from "../guw/GuwDrsPage";
import { HodDrsPage } from "../hod/HodDrsPage";
import { SrUwDrsPage } from "../sr-uw/SrUwDrsPage";
import { referralConfigForRoleType } from "../../services/referralUwService";

/**
 * Dispatches to the correct DRS page based on the `roleType` query param
 * passed by the inbox on row click.
 *
 *  MMT / MMT_TASK                   →  MmtGrievanceDrsPage
 *  MEDICAL_TPA_ERROR                →  TpaDrsPage
 *  DVT_POOL / GOPS_DVT / DVT_FORMAL  →  DvtUser
 *  GUW (no memberId)                 →  redirect to /guw/member-selection
 *  GUW (with memberId)               →  GuwUser   (after member is selected)
 *  HOD_TASK / SR_UW_TASK (no memberId)   →  redirect to /referral/member-selection
 *  HOD_TASK / SR_UW_TASK (with memberId) →  HodDrsPage / SrUwDrsPage
 *  GUW_FORMAL or unknown             →  GuwDrsPage
 */
const DVT_ROLE_TYPES = new Set(["DVT_POOL", "GOPS_DVT", "DVT_FORMAL"]);
const MMT_ROLE_TYPES = new Set(["MMT", "MMT_TASK"]);
const MEDICAL_TPA_ROLE_TYPES = new Set(["MEDICAL_TPA_ERROR"]);

export default function GroupDrsRouter() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const roleType = params.get("roleType")?.trim().toUpperCase() ?? "";
  const memberId = params.get("memberId")?.trim() ?? "";
  const referralConfig = referralConfigForRoleType(roleType);

  useEffect(() => {
    if (roleType === "GUW" && memberId === "") {
      // No member selected yet — go to member selection page, preserving all params.
      navigate(`/guw/member-selection?${params.toString()}`, { replace: true });
    } else if (referralConfig && memberId === "") {
      // HOD / Sr UW — same member selection step as GUW.
      navigate(`/referral/member-selection?${params.toString()}`, { replace: true });
    }
  }, [roleType, memberId, referralConfig, navigate, params]);

  if (MMT_ROLE_TYPES.has(roleType)) {
    return <MmtGrievanceDrsPage />;
  }

  if (MEDICAL_TPA_ROLE_TYPES.has(roleType)) {
    return <TpaDrsPage />;
  }

  if (referralConfig) {
    if (memberId === "") return null; // redirect to member selection pending
    return referralConfig.role === "HOD" ? <HodDrsPage /> : <SrUwDrsPage />;
  }

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
