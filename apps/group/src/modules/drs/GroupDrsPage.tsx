import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { fetchGuwMembers } from "../../services/guwService";

/**
 * GUW entry: when `data[]` of guw-informal-drs.json holds more than one member and no member is
 * selected yet, go to the member selection page; otherwise open the GUW DRS directly.
 */
function GuwEntry() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const applicationNo = params.get("applicationNo")?.trim() ?? "";
  const memberId = params.get("memberId")?.trim() ?? "";
  const needsCheck = memberId === "" && applicationNo !== "";
  const [checked, setChecked] = useState(!needsCheck);

  useEffect(() => {
    if (!needsCheck) return;
    let active = true;
    void fetchGuwMembers(applicationNo).then((members) => {
      if (!active) return;
      if (members.length > 1) {
        navigate(`/guw/member-selection?${params.toString()}`, { replace: true });
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

/** `/app/{applicationNo}/drs` — `roleType` query param picks the screen (GUW vs DVT). */
const SCREEN_BY_ROLE_TYPE: Record<string, () => JSX.Element | null> = {
  GUW: GuwEntry,
};

export function GroupDrsPage() {
  const [params] = useSearchParams();
  const roleType = params.get("roleType")?.trim().toUpperCase() ?? "";
  const Screen = SCREEN_BY_ROLE_TYPE[roleType] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;
