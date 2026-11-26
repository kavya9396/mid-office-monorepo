import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDrsMemberId,
  getDrsRoleType,
  setDrsOpenContext,
} from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { RefCmoDrsPage } from "./RefCmoDrsPage";
import { HoCmoSpecial } from "./HoCmoSpecial";
import { HoCmoReferral } from "./HoCmoReferral";
import { VendorCmoEcg } from "./VendorCmoEcg";
import { VendorCmoTmt } from "./VendorCmoTmt";
import { fetchGuwMembers, referralConfigForRoleType } from "../../services/drsService";
import { ReferralDrsPage } from "../referral-uw/ReferralDrsPage";
import DptNmrUser from "./DptNmrUser";
import DptMrUser from "./DptMrUser";
import ReinsurerUser from "./ReinsurerUser";
import { findGroupDrsTaskConfig } from "../../config/drsTaskConfig";

interface MemberEntryProps {
  /** Member selection page opened when the DRS payload holds more than one member. */
  memberSelectionPath: string;
  children: JSX.Element;
}

/**
 * GUW / HOD / Sr UW entry: the DRS API (same request body as DVT, `roleType` from the task config) returns
 * the members. When it holds more than one member and no member is selected yet, go to the member selection
 * page; otherwise open the DRS directly.
 */
function MemberEntry({ memberSelectionPath, children }: Readonly<MemberEntryProps>) {
  const { applicationNo: applicationNoParam } = useParams();
  const navigate = useNavigate();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const memberId = getDrsMemberId();
  const needsCheck = memberId === "" && applicationNo !== "";
  const [checked, setChecked] = useState(!needsCheck);

  useEffect(() => {
    if (!needsCheck) return;
    let active = true;
    void fetchGuwMembers(applicationNo, getDrsRoleType()).then((members) => {
      if (!active) return;
      if (members.length > 1) {
        setDrsOpenContext({
          applicationNo,
          memberCount: members.length,
          memberId: "",
        });
        void navigate(memberSelectionPath, { replace: true });
      } else {
        setDrsOpenContext({ applicationNo, memberCount: 1, memberId: "" });
        setChecked(true);
      }
    });
    return () => {
      active = false;
    };
  }, [needsCheck, applicationNo, memberSelectionPath, navigate]);

  return checked ? children : null;
}

function GuwEntry() {
  return (
    <MemberEntry memberSelectionPath="/guw/member-selection">
      <GuwUser />
    </MemberEntry>
  );
}

/** HOD / Sr UW: same member entry as GUW, then the referral DRS (prototype hod-drs / sr-uw-drs). */
function ReferralEntry({ roleType }: Readonly<{ roleType: string }>) {
  const config = referralConfigForRoleType(roleType);
  if (!config) return null;
  return (
    <MemberEntry memberSelectionPath="/referral/member-selection">
      <ReferralDrsPage config={config} />
    </MemberEntry>
  );
}

/**
 * `/app/{applicationNo}/drs` — the inbox session `roleType` (from the role-list response) is looked up in
 * `GROUP_DRS_TASK_CONFIG`; its `screenType` picks the screen. A new task needs a config entry only.
 */
const SCREEN_BY_SCREEN_TYPE: Record<string, () => JSX.Element | null> = {
  GUW_INFORMAL: GuwEntry,
  DVT_INFORMAL: DvtUser,
  MMT: MmtGrievanceDrsPage,
  CPT_NMR: DptNmrUser,
  CPT_MR: DptMrUser,
  REINSURER: ReinsurerUser,
  VENDOR_CMO_TMT: VendorCmoTmt,
  REF_CMO: RefCmoDrsPage,
  VENDOR_CMO_ECG: VendorCmoEcg,
  HO_CMO_SPECIAL: HoCmoSpecial,
  HO_CMO_REFERRAL: HoCmoReferral,
};

export function GroupDrsPage() {
  const roleType = getDrsRoleType();
  if (referralConfigForRoleType(roleType)) return <ReferralEntry roleType={roleType} />;
  const taskConfig = findGroupDrsTaskConfig(roleType);
  const Screen = taskConfig ? SCREEN_BY_SCREEN_TYPE[taskConfig.screenType] : undefined;
  if (!Screen) return <div>Page not found</div>;
  return <Screen />;
}

export default GroupDrsPage;