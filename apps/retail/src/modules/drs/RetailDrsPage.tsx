import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getDrsMemberId,
  getDrsRoleType,
  setDrsOpenContext,
} from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import CvtUser from "./CvtUser";
import CptNmrUser from "./CptNmrUser";
import CptMrUser from "./CptMrUser";
import PreIssuanceCvtUser from "./PreIssuanceCvtUser";
import TpaDrsPage from "./TpaDrsPage";
import CuwUser from "./CuwUser";
import PivvUser from "./PivvUser";
import { fetchCuwMembers } from "../../services/drsService";
import { findRetailDrsTaskConfig } from "../../config/drsTaskConfig";
import RetailDrsRecordPage from "./RetailDrsRecordPage";

interface MemberEntryProps {
  /** Member selection page opened when the DRS payload holds more than one member. */
  memberSelectionPath: string;
  children: JSX.Element;
}

/**
 * CUW / HOD / Sr UW entry: the DRS API (`roleType` from the task config) returns the members. When it holds
 * more than one member and no member is selected yet, go to the member selection page; otherwise open the DRS.
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
    void fetchCuwMembers(applicationNo, getDrsRoleType()).then((members) => {
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

function CuwEntry() {
  return (
    <MemberEntry memberSelectionPath="/cuw/member-selection">
      <CuwUser />
    </MemberEntry>
  );
}

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
/** Keys match `roleType` on inbox cases (see `retailInbox.json` poolData). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  CUW_TASK: CuwEntry,
  HOD_TASK: CuwEntry,
  HOD: CuwEntry,
  SR_UW_TASK: CuwEntry,
  SR_UW: CuwEntry,
  MMT_TASK: MmtGrievanceDrsPage,
  AMR_NON_MEDICAL: TpaDrsPage,
  MEDICAL_TPA_ERROR: TpaDrsPage,
  CVT_TASK: CvtUser,
  CPT_DATA_ENTRY_NMR_TASK: CptNmrUser,
  CPT_DATA_ENTRY_MR_TASK: CptMrUser,
  PRE_ISSUANCE_CVT_TASK: PreIssuanceCvtUser,
/**
 * `/app/{applicationNo}/drs` — the inbox session `roleType` (from the role-list response) is looked up in
 * `RETAIL_DRS_TASK_CONFIG`; its `screenType` picks the screen. A new task needs a config entry only.
 */
const SCREEN_BY_SCREEN_TYPE: Record<string, () => JSX.Element | null> = {
  CUW: CuwEntry,
  CVT: CvtUser,
  MMT: MmtGrievanceDrsPage,
  TPA: TpaDrsPage,
  CPT_NMR: CptNmrUser,
  CPT_MR: CptMrUser,
  PIVV: PivvUser,
};

export function RetailDrsPage() {
  const taskConfig = findRetailDrsTaskConfig(getDrsRoleType());
  const Screen = (taskConfig ? SCREEN_BY_SCREEN_TYPE[taskConfig.screenType] : undefined) ?? RetailDrsRecordPage;
  return <Screen />;
}

export default RetailDrsPage;
