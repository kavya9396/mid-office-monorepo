import { CmoDrsScreen } from "./CmoDrsScreen";

/** REF CMO DRS. Role and screen type come from `drsTaskConfig`. */
export function RefCmoDrsPage() {
  return <CmoDrsScreen testId="ref-cmo-drs-main" roleType="REF_CMO_TASK" />;
}

export default RefCmoDrsPage;
