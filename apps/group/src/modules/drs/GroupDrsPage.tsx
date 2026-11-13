import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getDrsRoleType } from "@insurance-poc/utils";
import { MmtGrievanceDrsPage } from "./MmtGrievanceDrsPage";
import { TpaDrsPage } from "./TpaDrsPage";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { fetchGuwMembers } from "../../services/guwService";

/**
 * GUW entry: when `data.membersDetails[]` of guw-informal-drs.json holds more than one member and no
 * member is selected yet, go to the member selection page; otherwise open the GUW DRS directly.
 */
function GuwEntry() {
  const { applicationNo: applicationNoParam } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const memberId = params.get("memberId")?.trim() ?? "";
  const needsCheck = memberId === "" && applicationNo !== "";
  const [checked, setChecked] = useState(!needsCheck);

  useEffect(() => {
    if (!needsCheck) return;
    let active = true;
    void fetchGuwMembers(applicationNo).then((members) => {
      if (!active) return;
      if (members.length > 1) {
        const next = new URLSearchParams(params);
        next.set("applicationNo", applicationNo);
        navigate(`/guw/member-selection?${next.toString()}`, { replace: true });
      } else {
        setChecked(true);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- params is only read to forward the query
  }, [needsCheck, applicationNo, navigate]);

  return checked ? <GuwUser /> : null;
}

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  "GUW TASK": GuwEntry,
  GUW: GuwEntry,
  GUW_FORMAL: GuwEntry,
  "DVT TASK": DvtUser,
  DVT_POOL: DvtUser,
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
