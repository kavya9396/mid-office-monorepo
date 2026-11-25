import { CmoDrsScreen } from "./CmoDrsScreen";

/** Vendor CMO TMT. Role and screen type come from `drsTaskConfig`. */
export function VendorCmoTmt() {
  return <CmoDrsScreen testId="vendor-cmo-tmt-drs-main" roleType="VENDOR_CMO_TMT_TASK" />;
}

export default VendorCmoTmt;
