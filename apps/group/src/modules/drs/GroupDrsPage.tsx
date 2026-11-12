import { getDrsRoleType } from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import { TpaDrsPage } from "./TpaDrsPage";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";

/** `/app/{applicationNo}/drs` — screen from inbox session `roleType` (no query param). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element> = {
  "GUW TASK": GuwUser,
  GUW: GuwUser,
  GUW_FORMAL: GuwUser,
  "DVT TASK": DvtUser,
  "MMT TASK": MmtGrievanceDrsPage,
  MMT_TASK: MmtGrievanceDrsPage,
  AMR_NON_MEDICAL: TpaDrsPage,
  MEDICAL_TPA_ERROR: TpaDrsPage,
};

export function GroupDrsPage() {
  const roleType = getDrsRoleType().trim().toUpperCase();
  const Screen = SCREEN_BY_ROLE[roleType] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;
