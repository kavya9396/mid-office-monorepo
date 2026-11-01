import { useSearchParams } from "react-router-dom";
import DvtUser from "./DvtUser";
import GuwUser from "./GuwUser";
import { GuwDrsPage } from "../guw/GuwDrsPage";

/**
 * Dispatches to the correct DRS page based on the `roleType` query param
 * passed by the inbox on row click.
 *
 *  DVT_POOL / GOPS_DVT / DVT_FORMAL  →  DvtUser
 *  GUW                                →  GuwUser   (GUW pool / informal)
 *  GUW_FORMAL                         →  GuwDrsPage (GUW formal)
 */
const DVT_ROLE_TYPES = new Set(["DVT_POOL", "GOPS_DVT", "DVT_FORMAL"]);

export default function GroupDrsRouter() {
  const [params] = useSearchParams();
  const roleType = params.get("roleType")?.trim().toUpperCase() ?? "";

  if (DVT_ROLE_TYPES.has(roleType)) {
    return <DvtUser />;
  }

  if (roleType === "GUW") {
    return <GuwUser />;
  }

  // GUW_FORMAL or unknown — fall back to GUW Formal page
  return <GuwDrsPage />;
}
