import { useSearchParams } from "react-router-dom";
import DvtUser from "./DvtUser";
import GroupDrsRouter from "./GroupDrsRouter";
import GuwUser from "./GuwUser";

/** `/app/{applicationNo}/drs` — `role` query param picks the screen (DVT vs GUW) when no `roleType` is given. */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element> = {
  "GUW TASK": GuwUser,
  "DVT TASK": DvtUser,
};

export function GroupDrsPage() {
  const [params] = useSearchParams();
  // The inbox passes `roleType` (e.g. HOD_TASK) — GroupDrsRouter maps it to the right screen.
  if (params.get("roleType")?.trim()) {
    return <GroupDrsRouter />;
  }
  const role = params.get("role")?.trim().toUpperCase() ?? "";
  const Screen = SCREEN_BY_ROLE[role] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;
