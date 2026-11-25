import { CmoDrsScreen } from "./CmoDrsScreen";

/** HO CMO Special. Role and screen type come from `drsTaskConfig`. */
export function HoCmoSpecial() {
  return <CmoDrsScreen testId="ho-cmo-special-drs-main" roleType="HO_CMO_SPECIAL_TASK" />;
}

export default HoCmoSpecial;
