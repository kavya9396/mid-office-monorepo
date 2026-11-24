import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDrsMemberId,
  getDrsRoleType,
  setDrsOpenContext,
} from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import DvtUser from "./DvtUser";
import PreIssuanceDvtUser from "./PreIssuanceDvtUser";
import GuwUser from "./GuwUser";
import { ReferralDrsPage } from "../referral-uw/ReferralDrsPage";
import { fetchGuwMembers } from "../../services/drsService";
import { HOD_CONFIG, SR_UW_CONFIG } from "../../services/drsService";

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
        navigate(memberSelectionPath, { replace: true });
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

function HodEntry() {
  return (
    <MemberEntry memberSelectionPath="/referral/member-selection">
      <ReferralDrsPage config={HOD_CONFIG} />
    </MemberEntry>
  );
}

function SrUwEntry() {
  return (
    <MemberEntry memberSelectionPath="/referral/member-selection">
      <ReferralDrsPage config={SR_UW_CONFIG} />
    </MemberEntry>
  );
}

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
/** Keys match `roleType` on inbox cases (see `groupInbox.json` poolData). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  GUW_TASK: GuwEntry,
  HOD_TASK: HodEntry,
  HOD: HodEntry,
  SR_UW_TASK: SrUwEntry,
  SR_UW: SrUwEntry,
  DVT_TASK: DvtUser,
  PRE_ISSUANCE_DVT_TASK: PreIssuanceDvtUser,
  MMT_TASK: MmtGrievanceDrsPage,
};

export function GroupDrsPage() {
  const roleType = getDrsRoleType().trim().toUpperCase();
  const Screen = SCREEN_BY_ROLE[roleType] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;