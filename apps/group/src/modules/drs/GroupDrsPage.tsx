import { useSearchParams } from "react-router-dom";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";

/** `/app/{applicationNo}/drs` — `role` query param picks the screen (DVT vs GUW). */
const SCREEN_BY_ROLE: Record<string, () => JSX.Element> = {
  "GUW TASK": GuwUser,
  "DVT TASK": DvtUser,
};

export function GroupDrsPage() {
  const [params] = useSearchParams();
  const role = params.get("role")?.trim().toUpperCase() ?? "";
  const Screen = SCREEN_BY_ROLE[role] ?? DvtUser;
  return <Screen />;
}

export default GroupDrsPage;
