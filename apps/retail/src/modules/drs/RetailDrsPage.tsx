import { getDrsRoleType } from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import RetailDrsRecordPage from "./RetailDrsRecordPage";
import CvtUser from "./CvtUser";
import CptNmrUser from "./CptNmrUser";
import CptMrUser from "./CptMrUser";
import TpaDrsPage from "./TpaDrsPage";

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
/** Keys match `roleType` on inbox cases (see `retailInbox.json` poolData). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  MMT_TASK: MmtGrievanceDrsPage,
  AMR_NON_MEDICAL: TpaDrsPage,
  MEDICAL_TPA_ERROR: TpaDrsPage,
  CVT_TASK: CvtUser,
  CPT_DATA_ENTRY_NMR_TASK: CptNmrUser,
  CPT_DATA_ENTRY_MR_TASK: CptMrUser,
};

export function RetailDrsPage() {
  const roleType = getDrsRoleType().trim().toUpperCase();
  const Screen = SCREEN_BY_ROLE[roleType] ?? RetailDrsRecordPage;
  return <Screen />;
}

export default RetailDrsPage;
