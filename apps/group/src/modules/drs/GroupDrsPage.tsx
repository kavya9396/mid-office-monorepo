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
import { fetchGuwMembers } from "../../services/guwService";

/**
 * GUW entry: when `data.membersDetails[]` of guw-informal-drs.json holds more than one member and no
 * member is selected yet, go to the member selection page; otherwise open the GUW DRS directly.
 */
function GuwEntry() {
  const { applicationNo: applicationNoParam } = useParams();
  const navigate = useNavigate();
  const applicationNo = applicationNoParam?.trim() ?? "";
  const memberId = getDrsMemberId();
  const needsCheck = memberId === "" && applicationNo !== "";
  const [checked, setChecked] = useState(!needsCheck);

  useEffect(() => {
    if (!needsCheck) return;
    let active = true;
    void fetchGuwMembers(applicationNo).then((members) => {
      if (!active) return;
      if (members.length > 1) {
        setDrsOpenContext({
          applicationNo,
          memberCount: members.length,
          memberId: "",
        });
        navigate("/guw/member-selection", { replace: true });
      } else {
        setDrsOpenContext({ applicationNo, memberCount: 1, memberId: "" });
        setChecked(true);
      }
    });
    return () => {
      active = false;
    };
  }, [needsCheck, applicationNo, navigate]);

  return checked ? <GuwUser /> : null;
}

/** `/app/{applicationNo}/drs` — screen picked from inbox session `roleType`. */
/** Keys match `roleType` on inbox cases (see `groupInbox.json` poolData). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element | null> = {
  GUW_TASK: GuwEntry,
  DVT_TASK: DvtUser,
  MMT_TASK: MmtGrievanceDrsPage,
};

export function GroupDrsPage() {
  const roleType = getDrsRoleType().trim().toUpperCase();
  const Screen = SCREEN_BY_ROLE[roleType] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;