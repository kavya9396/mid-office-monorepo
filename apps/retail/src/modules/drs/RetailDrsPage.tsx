import { getDrsRoleType } from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import { TpaDrsPage } from "./TpaDrsPage";
import RetailDrsRecordPage from "./RetailDrsRecordPage";
import CvtUser from "./CvtUser";

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
/** Keys match `roleType` on inbox cases (see `retailInbox.json` poolData). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  "MMT TASK": MmtGrievanceDrsPage,
  MMT_TASK: MmtGrievanceDrsPage,
  AMR_NON_MEDICAL: TpaDrsPage,
  MEDICAL_TPA_ERROR: TpaDrsPage,
  CVT_TASK: CvtUser
};

export function RetailDrsPage() {
  const roleType = getDrsRoleType().trim().toUpperCase();
  const Screen = SCREEN_BY_ROLE[roleType] ?? RetailDrsRecordPage;
  return <Screen />;
}

export default RetailDrsPage;
