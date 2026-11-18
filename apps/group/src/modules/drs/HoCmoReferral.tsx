import { CmoDrsScreen } from "./CmoDrsScreen";

/** HO CMO Referral. Role and screen type come from `drsTaskConfig`. */
export function HoCmoReferral() {
  return <CmoDrsScreen testId="ho-cmo-referral-drs-main" />;
}

export default HoCmoReferral;
